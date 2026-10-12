import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { createEvidence, recordCheck, verifyEvidence } from '../skills/planet/scripts/evidence.mjs';

async function project(t) {
  const directory = await mkdtemp(join(tmpdir(), 'planet-user-evidence-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const root = join(directory, 'user project');
  const evidence = join(directory, 'task evidence');
  await mkdir(root);
  assert.equal(spawnSync('git', ['init', '--quiet', root], { encoding: 'utf8' }).status, 0);
  await writeFile(join(root, '.gitignore'), 'build/\n');
  await writeFile(join(root, 'billing.py'), 'def eligible(order):\n    return order.paid\n');
  assert.equal(spawnSync('git', ['add', '.'], { cwd: root }).status, 0);
  // This dirty change predates the task and must not appear as its delta.
  await writeFile(join(root, 'billing.py'), 'def eligible(order):\n    return order.paid and not order.refunded\n');
  await createEvidence(root, evidence);
  return { root, evidence, directory };
}

function reviewFor(report) {
  return {
    basis: report.basis, revision: report.revision, reviewer: 'operator-supplied-reviewer-id',
    technicalVerdict: 'ready', findings: [], openDecisions: [],
    metrics: [{ principle: 'P4', metric: 'scenario-coverage', status: 'met', met: 1, total: 1, unknown: 0,
      units: ['refund-boundary'], evidence: ['test log and billing.py:2'] }],
  };
}

test('baseline preserves dirty files and missing checks remain unknown', async t => {
  const { root, evidence } = await project(t);
  const index = await readFile(join(root, '.git/index'));
  const report = await verifyEvidence(evidence);
  assert.deepEqual(report.changes, []);
  assert.equal(report.commands.status, 'unknown');
  assert.equal(report.commands.total, 0);
  assert.equal(report.review.status, 'unknown');
  assert.equal(report.authorization.status, 'unknown');
  assert.equal(report.codeQuality.status, 'unknown');
  assert.deepEqual(await readFile(join(root, '.git/index')), index);
  const basis = JSON.parse(await readFile(join(evidence, 'basis.json'), 'utf8'));
  assert.equal(basis.head, null);
  assert.ok(basis.files.some(file => file.path === 'billing.py'));
  await assert.rejects(createEvidence(root, evidence), { code: 'EEXIST' });
});

test('native command capture preserves cwd, args and output without implying scenario coverage', async t => {
  const { root, evidence } = await project(t);
  const argument = 'ordinary argument; not a shell command';
  const record = await recordCheck(evidence, [process.execPath, '-e',
    'console.log(process.cwd()); console.log(process.argv[1]); console.error("no acceptance test was run")', argument]);
  assert.equal(record.exitCode, 0);
  assert.ok(record.stdout.includes(root));
  assert.ok(record.stdout.includes(argument));
  assert.ok(record.stderr.includes('no acceptance test'));
  const report = await verifyEvidence(evidence);
  assert.equal(report.commands.unit, 'recorded command executions');
  assert.equal(report.commands.met, 1);
  assert.equal(report.commands.total, 1);
  assert.equal(report.commands.status, 'met');
  assert.equal(report.codeQuality.status, 'unknown');
});

test('successful checks cannot cancel a current failure or confer reviewer authorization', async t => {
  const { evidence } = await project(t);
  await recordCheck(evidence, [process.execPath, '-e', 'console.error("boundary failed"); process.exit(2)']);
  await recordCheck(evidence, [process.execPath, '-e', 'process.exit(0)']);
  const initial = await verifyEvidence(evidence);
  await writeFile(join(evidence, 'review.json'), JSON.stringify(reviewFor(initial)));
  const report = await verifyEvidence(evidence);
  assert.equal(report.commands.violated, 1);
  assert.equal(report.commands.met, 1);
  assert.equal(report.commands.status, 'violated');
  assert.equal(report.review.status, 'reported');
  assert.equal(report.review.technicalVerdict, 'ready');
  assert.deepEqual(report.review.representedPrinciples, ['P4']);
  assert.deepEqual(report.review.missingPrinciples, ['P1', 'P2', 'P3', 'P5', 'P6', 'P7']);
  assert.equal(report.review.independence, 'unknown');
  assert.equal(report.review.readOnly, 'unknown');
  assert.equal(report.authorization.status, 'unknown');
});

test('later edits invalidate check and review evidence, including untracked and deleted files', async t => {
  const { root, evidence } = await project(t);
  await recordCheck(evidence, [process.execPath, '-e', 'process.exit(0)']);
  const before = await verifyEvidence(evidence);
  await writeFile(join(evidence, 'review.json'), JSON.stringify(reviewFor(before)));
  await writeFile(join(root, 'billing.py'), 'def eligible(order):\n    return False\n');
  await writeFile(join(root, 'new module.go'), 'package billing\n');
  await unlink(join(root, '.gitignore'));
  const report = await verifyEvidence(evidence);
  assert.notEqual(report.revision, before.revision);
  assert.equal(report.commands.met, 0);
  assert.equal(report.commands.unknown, 1);
  assert.equal(report.review.status, 'unknown');
  assert.match(report.review.reason, /revision does not match/);
  assert.deepEqual(report.changes.map(change => change.path), ['.gitignore', 'billing.py', 'new module.go']);
});

test('a command changing source cannot validate its resulting revision', async t => {
  const { evidence } = await project(t);
  const record = await recordCheck(evidence, [process.execPath, '-e',
    'require("node:fs").writeFileSync("billing.py", "changed by a formatter\\n")']);
  assert.equal(record.exitCode, 0);
  assert.notEqual(record.before, record.after);
  const report = await verifyEvidence(evidence);
  assert.equal(report.commands.unknown, 1);
  assert.match(report.commands.records[0].reason, /changed during/);
  await recordCheck(evidence, [process.execPath, '-e', 'process.exit(0)']);
  assert.equal((await verifyEvidence(evidence)).commands.met, 1);
});

test('failed command launch and malformed or mismatched records are unknown, not passes', async t => {
  const { evidence } = await project(t);
  const record = await recordCheck(evidence, ['planet-command-that-does-not-exist']);
  assert.ok(record.error);
  await writeFile(join(evidence, 'check-malformed.json'), '{');
  const other = await recordCheck(evidence, [process.execPath, '-e', 'process.exit(0)']);
  const stored = JSON.parse(await readFile(other.path, 'utf8'));
  stored.basis = '0'.repeat(64);
  await writeFile(other.path, JSON.stringify(stored));
  const report = await verifyEvidence(evidence);
  assert.equal(report.commands.total, 3);
  assert.equal(report.commands.met, 0);
  assert.equal(report.commands.unknown, 3);
  await assert.rejects(recordCheck(evidence, []), /explicit command/);
});

test('review measurements retain unknowns and reject invented coverage', async t => {
  const { evidence } = await project(t);
  const current = await verifyEvidence(evidence);
  const report = reviewFor(current);
  report.metrics.push({ principle: 'P3', metric: 'replacement-justification', status: 'unknown',
    met: null, total: null, unknown: null, units: [], evidence: [], reason: 'Inventory is unavailable.' });
  await writeFile(join(evidence, 'review.json'), JSON.stringify(report));
  assert.equal((await verifyEvidence(evidence)).review.status, 'reported');
  report.metrics.push({ principle: 'P1', metric: 'speculative-elements', status: 'met', count: 0,
    units: ['changed-code'], evidence: ['reviewed diff'] });
  report.metrics.push({ principle: 'P3', metric: 'replacement-justification', status: 'not_applicable',
    met: 0, total: 0, unknown: 0, units: [], evidence: ['reviewed diff'], reason: 'No replacement in the diff.' });
  await writeFile(join(evidence, 'review.json'), JSON.stringify(report));
  assert.equal((await verifyEvidence(evidence)).review.status, 'reported');
  const invalid = [
    { met: 0, total: 0, units: [] },
    { met: 2, total: 1 },
    { met: 2, total: 2, units: ['same', 'same'] },
    { met: 3, total: 3, units: ['only-one-listed'] },
    { evidence: [] },
    { status: 'not_applicable', reason: 'Not examined.' },
    { status: 'not_applicable', met: null, total: null, unknown: null, units: [], reason: 'Not measured.' },
    { count: 0, met: 0, total: 1, unknown: 1 },
    { status: 'violated', met: 1, total: 1 },
  ];
  for (const fields of invalid) {
    const candidate = reviewFor(current);
    Object.assign(candidate.metrics[0], fields);
    await writeFile(join(evidence, 'review.json'), JSON.stringify(candidate));
    assert.equal((await verifyEvidence(evidence)).review.status, 'unknown', JSON.stringify(fields));
  }
});

test('corrupted baseline is rejected rather than redefining the task delta', async t => {
  const { evidence } = await project(t);
  const path = join(evidence, 'basis.json');
  const basis = JSON.parse(await readFile(path, 'utf8'));
  basis.files[0].hash = '0'.repeat(64);
  await writeFile(path, JSON.stringify(basis));
  await assert.rejects(verifyEvidence(evidence), /inconsistent baseline/);
});

test('evidence cannot be written into source or through a symlink back into source', async t => {
  const { root, directory } = await project(t);
  await assert.rejects(createEvidence(root, join(root, 'artifacts')), /outside the source repository/);
  const link = join(directory, 'source alias');
  await symlink(root, link, process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(createEvidence(root, join(link, 'artifacts')), /outside the source repository/);
  await assert.rejects(readFile(join(root, 'artifacts/basis.json')), { code: 'ENOENT' });
});

test('ignored outputs do not invalidate checks; symlink limitations are explicit', async t => {
  const { root, evidence, directory } = await project(t);
  await mkdir(join(root, 'build'));
  await writeFile(join(root, 'build/result.txt'), 'generated output');
  const before = await verifyEvidence(evidence);
  assert.deepEqual(before.changes, []);
  const external = join(directory, 'external.txt');
  await writeFile(external, 'external source');
  await symlink(external, join(root, 'external-link'), process.platform === 'win32' ? 'file' : undefined);
  const report = await verifyEvidence(evidence);
  assert.ok(report.limitations.some(reason => reason.includes('Symlink target contents')));
});

test('tracked paths replaced by external directory links are not read as repository source', async t => {
  const { root, directory } = await project(t);
  const tracked = join(root, 'tracked');
  await mkdir(tracked);
  await writeFile(join(tracked, 'source.py'), 'original source');
  assert.equal(spawnSync('git', ['add', 'tracked'], { cwd: root }).status, 0);
  const external = join(directory, 'external source');
  await mkdir(external);
  await writeFile(join(external, 'source.py'), 'not repository source');
  await rm(tracked, { recursive: true });
  await symlink(external, tracked, process.platform === 'win32' ? 'junction' : 'dir');
  const evidence = join(directory, 'linked task evidence');
  await createEvidence(root, evidence);
  const basis = JSON.parse(await readFile(join(evidence, 'basis.json'), 'utf8'));
  const file = basis.files.find(file => file.path === 'tracked/source.py');
  assert.equal(file.kind, 'external');
  assert.equal(file.hash, null);
  assert.ok(basis.limitations.some(reason => reason.includes('outside the repository')));
});

test('standalone CLI works from a user repository and does not turn verify exit zero into approval', async t => {
  const { root, evidence } = await project(t);
  const script = fileURLToPath(new URL('../skills/planet/scripts/evidence.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [script, 'verify', evidence], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.commands.status, 'unknown');
  assert.equal(report.authorization.status, 'unknown');
  const failed = spawnSync(process.execPath, [script, 'check', evidence, '--', process.execPath, '-e', 'process.exit(3)'],
    { cwd: root, encoding: 'utf8' });
  assert.equal(failed.status, 1, failed.stderr);
  assert.equal(JSON.parse(failed.stdout).exitCode, 3);
  const invalid = spawnSync(process.execPath, [script, 'unknown'], { cwd: root, encoding: 'utf8' });
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /Usage:/);
});

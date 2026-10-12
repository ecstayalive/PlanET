import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, mkdir, readFile, readdir, readlink, realpath, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const hash = value => createHash('sha256').update(value).digest('hex');
const isRevision = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

function isWithin(root, path) {
  const location = relative(root, path);
  return !location || (!isAbsolute(location) && location !== '..' && !location.startsWith(`..${sep}`));
}

function runGit(root, args, allowMissingHead = false) {
  const result = spawnSync('git', args, { cwd: root, timeout: 10_000, maxBuffer: 16 * 1024 * 1024 });
  if (result.error || (result.status !== 0 && !(allowMissingHead && result.status === 1))) throw new Error(result.error?.message ?? result.stderr.toString('utf8').trim());
  const output = result.stdout.toString('utf8');
  if (!Buffer.from(output, 'utf8').equals(result.stdout)) throw new Error('Git paths must be valid UTF-8; use native host evidence for this repository.');
  return output;
}

async function snapshotProject(directory) {
  const root = await realpath(runGit(directory, ['rev-parse', '--show-toplevel']).replace(/\r?\n$/, ''));
  const head = runGit(root, ['rev-parse', '--verify', '--quiet', 'HEAD'], true);
  const paths = [...new Set(runGit(root, ['ls-files', '--cached', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean))].sort();
  const files = [];
  const limitations = [];
  for (const path of paths) {
    const absolute = resolve(root, path);
    let entry;
    try {
      if (!isWithin(root, await realpath(dirname(absolute)))) {
        files.push({ path, kind: 'external', hash: null });
        limitations.push(`Tracked path crosses a symlink outside the repository: ${path}`);
        continue;
      }
      entry = await lstat(absolute);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      files.push({ path, kind: 'missing', hash: null });
      continue;
    }
    if (entry.isSymbolicLink()) {
      files.push({ path, kind: 'symlink', hash: hash(await readlink(absolute)) });
      limitations.push(`Symlink target contents are not captured: ${path}`);
    } else if (entry.isFile()) {
      const digest = createHash('sha256');
      for await (const chunk of createReadStream(absolute)) digest.update(chunk);
      files.push({ path, kind: 'file', hash: digest.digest('hex') });
    } else {
      files.push({ path, kind: 'directory', hash: null });
      limitations.push(`Submodule or non-file contents are not captured: ${path}`);
    }
  }
  return { root, head: head.trim() || null, files, limitations, id: hash(JSON.stringify({ head: head.trim() || null, files })) };
}

// Artifact writes must stay outside the user's source repository, including via symlinks.
async function resolveArtifactDirectory(root, directory) {
  const target = resolve(directory);
  let ancestor = target;
  for (;;) {
    let physical;
    try {
      physical = resolve(await realpath(ancestor), relative(ancestor, target));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      ancestor = dirname(ancestor);
      continue;
    }
    if (isWithin(root, physical)) {
      throw new Error('Keep evidence outside the source repository.');
    }
    return physical;
  }
}

async function loadBasis(directory) {
  let basis;
  try {
    basis = JSON.parse(await readFile(resolve(directory, 'basis.json'), 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read baseline snapshot: ${error.message}`);
  }
  if (basis.schemaVersion !== 1 || typeof basis.root !== 'string' || !isAbsolute(basis.root) ||
      (basis.head !== null && typeof basis.head !== 'string') ||
      !Array.isArray(basis.limitations) || basis.limitations.some(item => typeof item !== 'string') ||
      !Array.isArray(basis.files) || basis.files.some(file => !file || typeof file.path !== 'string' ||
        !['file', 'symlink', 'missing', 'directory', 'external'].includes(file.kind) ||
        (['file', 'symlink'].includes(file.kind) ? !isRevision(file.hash) : file.hash !== null)) ||
      new Set(basis.files.map(file => file.path)).size !== basis.files.length || !isRevision(basis.id) ||
      basis.id !== hash(JSON.stringify({ head: basis.head, files: basis.files }))) {
    throw new Error('Invalid or inconsistent baseline snapshot.');
  }
  const root = await realpath(basis.root);
  if (root !== basis.root) throw new Error('The recorded project location changed; create a new baseline.');
  const destination = await resolveArtifactDirectory(root, directory);
  return { basis, directory: await realpath(destination) };
}

export async function createEvidence(project, directory) {
  const snapshot = await snapshotProject(await realpath(project));
  const destination = await resolveArtifactDirectory(snapshot.root, directory);
  await mkdir(destination, { recursive: true });
  const basis = { schemaVersion: 1, ...snapshot, createdAt: new Date().toISOString() };
  await writeFile(resolve(destination, 'basis.json'), `${JSON.stringify(basis, null, 2)}\n`, { flag: 'wx' });
  return { directory: destination, basis: basis.id, project: basis.root, limitations: basis.limitations };
}

// This executes only the supplied command, without an implicit shell or model call.
// It is a recorder, not a permission gate: the host must authorize and isolate execution.
export async function recordCheck(directory, command) {
  if (!Array.isArray(command) || !command.length || command.some(part => typeof part !== 'string' || part.includes('\0')) || !command[0]) {
    throw new Error('Supply an explicit command and arguments after --.');
  }
  const loaded = await loadBasis(directory);
  const before = await snapshotProject(loaded.basis.root);
  const startedAt = new Date().toISOString();
  const result = spawnSync(command[0], command.slice(1), {
    cwd: loaded.basis.root, encoding: 'utf8', timeout: 120_000, maxBuffer: 1024 * 1024, shell: false,
  });
  const finishedAt = new Date().toISOString();
  let after = null;
  let snapshotError = null;
  try {
    const snapshot = await snapshotProject(loaded.basis.root);
    after = snapshot.id;
  } catch (error) {
    snapshotError = error.message;
  }
  const record = {
    schemaVersion: 1, origin: 'local-command', id: randomUUID(), basis: loaded.basis.id,
    before: before.id, after, command, startedAt, finishedAt,
    exitCode: result.status, signal: result.signal, error: result.error?.message ?? null,
    snapshotError, stdout: result.stdout ?? '', stderr: result.stderr ?? '',
  };
  const path = resolve(loaded.directory, `check-${record.id}.json`);
  await writeFile(path, `${JSON.stringify(record, null, 2)}\n`, { flag: 'wx' });
  return { path, ...record };
}

export async function verifyEvidence(directory) {
  const loaded = await loadBasis(directory);
  const current = await snapshotProject(loaded.basis.root);
  const initial = new Map(loaded.basis.files.map(file => [file.path, file]));
  const final = new Map(current.files.map(file => [file.path, file]));
  const changes = [];
  for (const path of [...new Set([...initial.keys(), ...final.keys()])].sort()) {
    if (JSON.stringify(initial.get(path)) !== JSON.stringify(final.get(path))) {
      let change = 'changed';
      if (!initial.has(path)) change = 'added';
      else if (!final.has(path)) change = 'removed';
      changes.push({ path, change });
    }
  }
  const records = [];
  const artifacts = await readdir(loaded.directory);
  for (const name of artifacts.filter(name => /^check-.+\.json$/.test(name)).sort()) {
    try {
      const record = JSON.parse(await readFile(resolve(loaded.directory, name), 'utf8'));
      if (record.schemaVersion !== 1 || record.origin !== 'local-command' || typeof record.id !== 'string' ||
          name !== `check-${record.id}.json` || record.basis !== loaded.basis.id ||
          !isRevision(record.before) || (record.after !== null && !isRevision(record.after)) ||
          !Array.isArray(record.command) || !record.command.length || record.command.some(part => typeof part !== 'string') ||
          typeof record.stdout !== 'string' || typeof record.stderr !== 'string' ||
          !Number.isFinite(Date.parse(record.startedAt)) || !Number.isFinite(Date.parse(record.finishedAt)) ||
          Date.parse(record.finishedAt) < Date.parse(record.startedAt) ||
          (record.exitCode !== null && (!Number.isInteger(record.exitCode) || record.exitCode < 0)) ||
          (record.error !== null && typeof record.error !== 'string')) {
        throw new Error('Invalid check record or baseline mismatch.');
      }
      let status;
      let reason;
      if (record.before !== record.after || record.after !== current.id) {
        status = 'unknown';
        reason = record.before !== record.after ? 'Source changed during the check, or the final snapshot is unavailable.' : 'Check belongs to an older source revision.';
      } else if (record.error || record.exitCode === null) {
        status = 'unknown';
        reason = record.error ?? 'Command did not return an exit code.';
      } else {
        status = record.exitCode === 0 ? 'met' : 'violated';
        reason = 'Observed command exit only; not acceptance-scenario coverage or code-quality proof.';
      }
      records.push({ file: name, command: record.command, exitCode: record.exitCode, status, reason });
    } catch (error) {
      records.push({ file: name, status: 'unknown', reason: error.message });
    }
  }
  const commands = {
    unit: 'recorded command executions', total: records.length,
    met: records.filter(record => record.status === 'met').length,
    violated: records.filter(record => record.status === 'violated').length,
    unknown: records.filter(record => record.status === 'unknown').length,
    records,
  };
  commands.status = 'unknown';
  if (commands.violated) commands.status = 'violated';
  else if (commands.total && !commands.unknown) commands.status = 'met';

  let review = { status: 'unknown', reason: 'No review artifact. Self-check is not independent review.' };
  try {
    const report = JSON.parse(await readFile(resolve(loaded.directory, 'review.json'), 'utf8'));
    if (report.basis !== loaded.basis.id || report.revision !== current.id) {
      review = { status: 'unknown', reason: 'Review baseline or source revision does not match.' };
    } else {
      if (typeof report.reviewer !== 'string' || !report.reviewer.trim() ||
          !['ready', 'needs_changes', 'insufficient_evidence'].includes(report.technicalVerdict) ||
          !Array.isArray(report.metrics) || !Array.isArray(report.findings) || !Array.isArray(report.openDecisions)) {
        throw new Error('Invalid review report.');
      }
      for (const metric of report.metrics) {
        if (!/^P[1-7]$/.test(metric.principle) || typeof metric.metric !== 'string' || !metric.metric.trim() ||
            !['met', 'violated', 'unknown', 'not_applicable'].includes(metric.status) ||
            !Array.isArray(metric.units) || !Array.isArray(metric.evidence) ||
            (['unknown', 'not_applicable'].includes(metric.status) && (typeof metric.reason !== 'string' || !metric.reason.trim()))) {
          throw new Error('Review metrics need principle, status, units, evidence and reasons for unknown/inapplicable judgments.');
        }
        for (const field of ['met', 'total', 'unknown', 'count']) {
          if (metric[field] !== undefined && metric[field] !== null && (!Number.isInteger(metric[field]) || metric[field] < 0)) {
            throw new Error('Metric counts must be nonnegative integers or null.');
          }
        }
        if (('total' in metric) === ('count' in metric) ||
            metric.units.some(unit => typeof unit !== 'string' || !unit.trim()) ||
            new Set(metric.units).size !== metric.units.length ||
            metric.evidence.some(citation => typeof citation !== 'string' || !citation.trim())) {
          throw new Error('Metrics need a coverage denominator or count, distinct unit IDs and nonempty citations.');
        }
        if (metric.total !== undefined && metric.total !== null &&
            (metric.total !== metric.units.length || (metric.met ?? 0) + (metric.unknown ?? 0) > metric.total ||
              (metric.total === 0 && metric.status === 'met'))) {
          throw new Error('Invalid coverage counts; list all units and never treat zero units as full marks.');
        }
        if (metric.status === 'not_applicable' && (!(metric.total === 0 || metric.count === 0) ||
            (metric.met ?? 0) !== 0 || (metric.unknown ?? 0) !== 0 || metric.units.length || !metric.evidence.length)) {
          throw new Error('Inapplicability needs an established empty population, cited evidence and a reason.');
        }
        if (metric.status === 'violated' && (!metric.units.length || !metric.evidence.length ||
            !((metric.count ?? 0) > 0 || (Number.isInteger(metric.total) && metric.total > (metric.met ?? 0) + (metric.unknown ?? 0))))) {
          throw new Error('A violation needs counted instances and cited evidence.');
        }
        if (metric.status === 'met' && (!metric.evidence.length || !metric.units.length ||
            !((Number.isInteger(metric.total) && metric.total > 0 && metric.met === metric.total) || metric.count === 0))) {
          throw new Error('A met judgment needs counted units and cited evidence.');
        }
      }
      review = {
        status: 'reported', reviewer: report.reviewer, technicalVerdict: report.technicalVerdict,
        representedPrinciples: [...new Set(report.metrics.map(metric => metric.principle))].sort(),
        missingPrinciples: Array.from({ length: 7 }, (_, index) => `P${index + 1}`).filter(principle => !report.metrics.some(metric => metric.principle === principle)),
        metrics: report.metrics, findings: report.findings, openDecisions: report.openDecisions,
        independence: 'unknown', readOnly: 'unknown',
        reason: 'Revision and report shape checked. Reviewer identity, independence, citations and judgments require host/operator verification.',
      };
    }
  } catch (error) {
    if (error.code !== 'ENOENT') review = { status: 'unknown', reason: error.message };
  }
  return {
    schemaVersion: 1, project: current.root, basis: loaded.basis.id, revision: current.id,
    changes, commands, review,
    authorization: { status: 'unknown', reason: 'This tool does not authenticate user approval, action ordering or permitted scope.' },
    codeQuality: { status: 'unknown', reason: 'Command exits and model judgments do not establish correctness, maintainability or skill effectiveness.' },
    limitations: [...new Set([...loaded.basis.limitations, ...current.limitations]),
      'Snapshot covers Git-listed working-tree files, not ignored files, external dependencies or the whole execution environment.',
      'Files may change while snapshots are read; serialize work and use host isolation when stronger guarantees are needed.',
      'Artifact consistency is not authenticity. Protect evidence with host permissions; editable records can be fabricated.'],
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [action, ...args] = process.argv.slice(2);
  try {
    let result;
    if (action === 'snapshot' && args.length === 2) result = await createEvidence(args[0], args[1]);
    else if (action === 'check' && args.length >= 3 && args[1] === '--') {
      result = await recordCheck(args[0], args.slice(2));
      if (result.exitCode !== 0 || result.error || result.before !== result.after) process.exitCode = 1;
    } else if (action === 'verify' && args.length === 1) result = await verifyEvidence(args[0]);
    else throw new Error('Usage: evidence.mjs snapshot <project> <outside-directory> | check <directory> -- <command> [args...] | verify <directory>');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

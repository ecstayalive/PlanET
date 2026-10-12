import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { copyFile, mkdir, mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import planet from '../extensions/planet.mjs';
import { guidanceTag, loadInstructions } from '../hooks/session-start.mjs';

async function copyPluginFixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'planet plugin-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const path of ['hooks/session-start.mjs', 'extensions/planet.mjs', 'skills/planet/SKILL.md']) {
    const destination = join(root, path);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(new URL(`../${path}`, import.meta.url), destination);
  }
  return root;
}

test('shell hook supplies a compact revision-bound bootstrap, not the full policy', () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../hooks/session-start.mjs', import.meta.url))], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout).hookSpecificOutput;
  assert.equal(output.hookEventName, 'SessionStart');
  assert.equal(output.additionalContext, loadInstructions());
  const policyPath = fileURLToPath(new URL('../skills/planet/SKILL.md', import.meta.url));
  const policy = readFileSync(policyPath);
  assert.ok(output.additionalContext.includes(JSON.stringify(policyPath)));
  assert.ok(output.additionalContext.includes(`sha256:${createHash('sha256').update(policy).digest('hex')}`));
  assert.ok(!output.additionalContext.includes('## Seven operating principles'));
  assert.match(output.additionalContext, /Before coding work, read/);
  assert.match(output.additionalContext, /After compaction, a summary is insufficient/);
  assert.match(output.additionalContext, /If unavailable, stop coding/);
  assert.ok(Buffer.byteLength(output.additionalContext) < 1024);
  assert.ok(Buffer.byteLength(output.additionalContext) < policy.length / 4);
  assert.equal(loadInstructions(), loadInstructions());
});

test('Pi uses an idempotent prompt section while preserving other extensions', () => {
  const handlers = new Map();
  planet({ on: (name, handler) => handlers.set(name, handler) });
  const event = { systemPromptOptions: { sections: { other: 'Existing guidance' } } };
  const run = handlers.get('before_agent_start');
  run(event);
  const initial = { ...event.systemPromptOptions.sections };
  for (const prompt of ['A coding task', 'Another task', 'New user feedback']) {
    run({ ...event, prompt });
    assert.deepEqual(event.systemPromptOptions.sections, initial);
  }
  assert.equal(initial.other, 'Existing guidance');
  assert.equal(initial.planet, loadInstructions());
  const restored = { systemPromptOptions: { sections: {} } };
  run(restored);
  assert.equal(restored.systemPromptOptions.sections.planet, initial.planet);
});

test('older Pi receives the same guidance without replacing its existing prompt', () => {
  let run;
  planet({ on: (_name, handler) => { run = handler; } });
  const output = run({ systemPrompt: 'Original instructions' }).systemPrompt;
  assert.equal(output, `Original instructions\n\n${loadInstructions()}`);
  assert.ok(output.startsWith('Original instructions'));
  assert.equal(run({ systemPrompt: output }), undefined);
});

test('Pi preserves a prior forced prompt and appends stable guidance only once', () => {
  let run;
  planet({ on: (_name, handler) => { run = handler; } });
  const event = { systemPrompt: 'Another extension owns this prompt.',
    systemPromptOptions: { forceSystemPrompt: 'Another extension owns this prompt.', sections: {} } };
  const output = run(event).systemPrompt;
  assert.ok(output.startsWith(event.systemPrompt));
  assert.equal(run({ ...event, systemPrompt: output }), undefined);
  assert.deepEqual(event.systemPromptOptions.sections, {});
});

test('Pi fallback does not duplicate guidance followed by another extension', () => {
  let run;
  planet({ on: (_name, handler) => { run = handler; } });
  const initial = run({ systemPrompt: 'Original instructions' }).systemPrompt;
  for (const suffix of ['\n\nAnother extension follows PlanET.', '  ', 'Inline suffix.', '\n']) {
    const prompt = `${initial}${suffix}`;
    for (const systemPromptOptions of [undefined, { forceSystemPrompt: prompt, sections: {} }]) {
      assert.equal(run({ systemPrompt: prompt, systemPromptOptions }), undefined);
    }
  }
});

test('Pi fallback repairs old and duplicate owned blocks in place', () => {
  let run;
  planet({ on: (_name, handler) => { run = handler; } });
  const instructions = loadInstructions();
  const stale = instructions.replace(/sha256:[a-f0-9]{64}/, `sha256:${'0'.repeat(64)}`);
  const prompt = `Before.\n\n${stale}\n\nBetween.\n\n${instructions}\n\nAfter.`;
  const expected = `Before.\n\n${instructions}\n\nBetween.\n\n\n\nAfter.`;
  const result = run({ systemPrompt: prompt }).systemPrompt;
  assert.equal(result, expected);
  assert.equal(result.split(`<${guidanceTag}>`).length - 1, 1);
  assert.equal(run({ systemPrompt: result }), undefined);
  const windowsPrompt = `Before.\n\n${instructions.replaceAll('\n', '\r\n')}\n\nAfter.`;
  assert.equal(run({ systemPrompt: windowsPrompt }).systemPrompt, `Before.\n\n${instructions}\n\nAfter.`);
});

test('Pi leaves partial and similar-looking markers untouched', () => {
  let run;
  planet({ on: (_name, handler) => { run = handler; } });
  const instructions = loadInstructions();
  const partial = `Original.\n<${guidanceTag}>\nAn incomplete example, not a complete owned block.`;
  const once = run({ systemPrompt: partial }).systemPrompt;
  assert.equal(once, `${partial}\n\n${instructions}`);
  assert.equal(run({ systemPrompt: once }), undefined);
  const similar = `<${guidanceTag}-example>\nKeep this.\n</${guidanceTag}-example>`;
  assert.equal(run({ systemPrompt: similar }).systemPrompt, `${similar}\n\n${instructions}`);
});

test('relocated bootstrap is content-bound, snapshots per load and refreshes on reload', async t => {
  const root = await copyPluginFixture(t);
  const loader = await import(pathToFileURL(join(root, 'hooks/session-start.mjs')).href);
  const adapter = (await import(pathToFileURL(join(root, 'extensions/planet.mjs')).href)).default;
  const policyPath = join(root, 'skills/planet/SKILL.md');
  const first = loader.loadInstructions();
  assert.ok(first.includes(JSON.stringify(policyPath)));
  const shell = spawnSync(process.execPath, [join(root, 'hooks/session-start.mjs')], { cwd: tmpdir(), encoding: 'utf8' });
  assert.equal(shell.status, 0, shell.stderr);
  assert.equal(JSON.parse(shell.stdout).hookSpecificOutput.additionalContext, first);
  let originalRun;
  adapter({ on: (_name, handler) => { originalRun = handler; } });
  await utimes(policyPath, new Date(0), new Date(0));
  await writeFile(join(root, 'unrelated.txt'), 'Not a policy revision.');
  assert.equal(loader.loadInstructions(), first);
  const originalPolicy = await readFile(policyPath);
  await writeFile(policyPath, Buffer.concat([originalPolicy, Buffer.from('\nChanged core policy.\n')]));
  const updated = loader.loadInstructions();
  assert.notEqual(updated, first);
  const updatedRevision = createHash('sha256').update(await readFile(policyPath)).digest('hex');
  assert.ok(updated.includes(`sha256:${updatedRevision}`));
  assert.equal(first.split('Core revision:')[0], updated.split('Core revision:')[0]);
  const event = { systemPromptOptions: { sections: { other: 'Other guidance' } } };
  originalRun(event);
  assert.equal(event.systemPromptOptions.sections.planet, first);
  let refreshedRun;
  adapter({ on: (_name, handler) => { refreshedRun = handler; } });
  refreshedRun(event);
  assert.deepEqual(event.systemPromptOptions.sections, { other: 'Other guidance', planet: updated });
  const oldPrompt = `Before.\n\n${first}\n\nAfter.`;
  const refreshed = refreshedRun({ systemPrompt: oldPrompt }).systemPrompt;
  assert.equal(refreshed, `Before.\n\n${updated}\n\nAfter.`);
  assert.equal(refreshedRun({ systemPrompt: refreshed }), undefined);
});

test('missing policy fails visibly instead of claiming guidance was loaded', async t => {
  const root = await copyPluginFixture(t);
  const loader = await import(pathToFileURL(join(root, 'hooks/session-start.mjs')).href);
  await rm(join(root, 'skills/planet/SKILL.md'));
  assert.throws(() => loader.loadInstructions(), { code: 'ENOENT' });
  const shell = spawnSync(process.execPath, [join(root, 'hooks/session-start.mjs')], { encoding: 'utf8' });
  assert.notEqual(shell.status, 0);
  assert.equal(shell.stdout, '');
  assert.match(shell.stderr, /ENOENT/);
});

test('startup matcher accepts only supported sources', async () => {
  const config = JSON.parse(await readFile(new URL('../hooks/hooks.json', import.meta.url), 'utf8'));
  const matcher = new RegExp(config.hooks.SessionStart[0].matcher);
  for (const source of ['startup', 'resume', 'clear', 'compact']) assert.ok(matcher.test(source));
  for (const source of ['precompact', 'startup-extra', 'not-resume', 'resumed', '']) assert.ok(!matcher.test(source));
});

test('Claude manifests omit the known unsupported icon fields', async () => {
  const manifest = JSON.parse(await readFile(new URL('../.claude-plugin/plugin.json', import.meta.url), 'utf8'));
  const marketplace = JSON.parse(await readFile(new URL('../.claude-plugin/marketplace.json', import.meta.url), 'utf8'));
  assert.ok(!Object.hasOwn(manifest, 'icon'));
  assert.ok(marketplace.plugins.every(plugin => !Object.hasOwn(plugin, 'icon')));
});

test('Codex and Agent Plugin manifests advertise existing brand icon assets', async () => {
  const pluginManifest = JSON.parse(await readFile(fileURLToPath(new URL('../plugin.json', import.meta.url)), 'utf8'));
  const codexManifest = JSON.parse(await readFile(fileURLToPath(new URL('../.codex-plugin/plugin.json', import.meta.url)), 'utf8'));

  const openaiInterface = pluginManifest.extensions?.['com.openai']?.interface;
  assert.equal(openaiInterface?.logo, './assets/icon.svg');
  assert.equal(openaiInterface?.composerIcon, './assets/icon.svg');
  assert.ok(existsSync(fileURLToPath(new URL('../assets/icon.svg', import.meta.url))));

  assert.equal(codexManifest.icon, './assets/icon.svg');
  assert.equal(codexManifest.interface?.logo, './assets/icon.svg');
  assert.equal(codexManifest.interface?.composerIcon, './assets/icon.svg');
});

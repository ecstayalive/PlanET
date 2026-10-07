import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import planet from '../extensions/planet.mjs';
import { loadInstructions } from '../hooks/session-start.mjs';

test('shell hook supplies the shared policy and installed resource paths', () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../hooks/session-start.mjs', import.meta.url))], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout).hookSpecificOutput;
  assert.equal(output.hookEventName, 'SessionStart');
  assert.equal(output.additionalContext, loadInstructions());
  assert.ok(output.additionalContext.includes(fileURLToPath(new URL('../skills/planet', import.meta.url))));
});

test('Pi uses an idempotent prompt section while preserving other extensions', () => {
  const handlers = new Map();
  planet({ on: (name, handler) => handlers.set(name, handler) });
  const event = { systemPromptOptions: { sections: { other: 'Existing guidance' } } };
  const run = handlers.get('before_agent_start');
  run(event);
  const initial = { ...event.systemPromptOptions.sections };
  run(event);
  assert.deepEqual(event.systemPromptOptions.sections, initial);
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

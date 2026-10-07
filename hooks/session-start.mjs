import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Both the shell hook and Pi adapter load the same policy, including after compaction.
export function loadInstructions() {
  const skill = readFileSync(resolve(root, 'skills/planet/SKILL.md'), 'utf8');
  const body = skill.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
  return `PlanET engineering guidance is loaded. Apply it to coding tasks, not unrelated conversation.\n`
    + `Skill directory: ${resolve(root, 'skills/planet')}\n`
    + `Visual skill: ${resolve(root, 'skills/planet-visual/SKILL.md')}\n\n${body}`;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: loadInstructions(),
    },
  }));
}

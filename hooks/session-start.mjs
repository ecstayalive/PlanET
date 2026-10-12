import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const guidanceTag = 'planet-guidance';

// All adapters share this loading instruction; engineering policy stays in the skill.
export function loadInstructions() {
  const policyPath = resolve(root, 'skills/planet/SKILL.md');
  const revision = createHash('sha256').update(readFileSync(policyPath)).digest('hex');
  return `<${guidanceTag}>\nPlanET applies to coding tasks.\n`
    + `Before coding work, read the policy file below unless the complete policy at this revision is in active context.\n`
    + `After compaction, a summary is insufficient; reload if the full policy is absent.\n`
    + `Load referenced docs and planet-visual only when relevant; reuse unchanged guidance.\n`
    + `If unavailable, stop coding and report the loading failure.\n`
    + `Policy file: ${JSON.stringify(policyPath)}\nCore revision: sha256:${revision}\n</${guidanceTag}>`;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  process.stdout.write(`${JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: loadInstructions(),
    },
  })}\n`);
}

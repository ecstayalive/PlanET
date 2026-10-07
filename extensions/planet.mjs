import { loadInstructions } from '../hooks/session-start.mjs';

export default function planet(pi) {
  // Snapshot once per extension load: no timestamp, turn state, or policy reread in the prefix.
  const instructions = loadInstructions();
  pi.on('before_agent_start', (event) => {
    // Current Pi supports structured prompt sections. Keep compatibility with older Pi.
    if (event.systemPromptOptions && event.systemPromptOptions.forceSystemPrompt === undefined) {
      event.systemPromptOptions.sections.planet = instructions;
      return;
    }
    if (!event.systemPrompt.endsWith(instructions)) {
      return { systemPrompt: `${event.systemPrompt}\n\n${instructions}` };
    }
  });
}

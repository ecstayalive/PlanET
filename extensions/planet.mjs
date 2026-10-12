import { guidanceTag, loadInstructions } from '../hooks/session-start.mjs';

export default function planet(pi) {
  // Snapshot once per extension load: no timestamp, turn state, or policy reread in the prefix.
  const instructions = loadInstructions();
  // A nested opener ends a partial block; never consume intervening foreign text.
  const guidanceBlock = new RegExp(`^<${guidanceTag}>\\r?\\n(?:(?!^<${guidanceTag}>)[\\s\\S])*?^</${guidanceTag}>`, 'gm');
  pi.on('before_agent_start', (event) => {
    // Current Pi supports structured prompt sections. Keep compatibility with older Pi.
    if (event.systemPromptOptions && event.systemPromptOptions.forceSystemPrompt === undefined) {
      event.systemPromptOptions.sections.planet = instructions;
      return;
    }
    // Replace only our named block in place, even if another extension follows it.
    let included = false;
    const prompt = event.systemPrompt.replace(guidanceBlock, () => {
      if (included) return '';
      included = true;
      return instructions;
    });
    if (!included) return { systemPrompt: `${prompt}\n\n${instructions}` };
    if (prompt !== event.systemPrompt) return { systemPrompt: prompt };
  });
}

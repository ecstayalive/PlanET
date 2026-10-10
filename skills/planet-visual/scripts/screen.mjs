import { createHash } from 'node:crypto';
import { layoutDiagram } from '../public/diagram.js';

// A shared boundary contract for disk input, browser output, and confirmations.
export function validateScreen(screen) {
  if (!screen || typeof screen !== 'object' || Array.isArray(screen)) {
    throw new Error('Screen must be an object.');
  }
  if (!/^[a-z][a-z0-9-]*$/.test(screen.id ?? '')) {
    throw new Error('Screen id must be a descriptive lowercase slug.');
  }
  if (!['view', 'decision'].includes(screen.mode)) {
    throw new Error('Screen mode must be view or decision.');
  }
  if (typeof screen.title !== 'string' || !screen.title.trim()) {
    throw new Error('Screen title is required.');
  }
  if (screen.summary !== undefined && typeof screen.summary !== 'string') {
    throw new Error('Screen summary must be text.');
  }
  for (const [name, required, optional] of [
    ['panels', ['title'], ['text', 'code', 'html', 'file', 'symbol', 'language', 'originalCode']],
    ['choices', ['id', 'label'], ['description', 'html', 'code', 'file', 'symbol', 'originalCode']],
  ]) {
    if (screen[name] !== undefined && !Array.isArray(screen[name])) {
      throw new Error(`${name} must be an array.`);
    }
    for (const item of screen[name] ?? []) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new Error(`${name} entries must be objects.`);
      }
      for (const field of required) {
        if (typeof item[field] !== 'string' || !item[field].trim()) {
          throw new Error(`${name}.${field} is required.`);
        }
      }
      for (const field of optional) {
        if (item[field] !== undefined && typeof item[field] !== 'string') {
          throw new Error(`${name}.${field} must be text.`);
        }
      }
      if (name === 'panels' && item.diagram !== undefined) layoutDiagram(item.diagram);
    }
  }
  const choices = screen.choices ?? [];
  if (screen.mode === 'view' && choices.length) {
    throw new Error('Views cannot request choices.');
  }
  if (choices.some(choice => !/^[a-z][a-z0-9-]*$/.test(choice.id))) {
    throw new Error('Choice ids must be descriptive lowercase slugs.');
  }
  if (new Set(choices.map(choice => choice.id)).size !== choices.length) {
    throw new Error('Choice ids must be unique.');
  }
  // Caller-supplied revisions never override the server-derived content revision.
  const { revision: ignored, ...content } = screen;
  return { ...content, revision: createHash('sha256').update(JSON.stringify(content)).digest('hex') };
}

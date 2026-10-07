import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { validateScreen } from '../skills/planet-visual/scripts/screen.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = [];

async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['.git', '.agents', '.aws', '.codex', '.planet', 'node_modules'].includes(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await inspect(path);
    else files.push(path);
  }
}

await inspect(root);
for (const path of files) {
  const body = await readFile(path, 'utf8');
  if (path.endsWith('.json')) JSON.parse(body);
  if (/\.(mjs|js)$/.test(path)) {
    const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
  if (path.endsWith('.md')) {
    for (const match of body.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || /^https?:/.test(target)) continue;
      assert.ok(files.includes(resolve(dirname(path), target)), `Broken reference in ${path}: ${target}`);
    }
  }
  if (path.endsWith('/SKILL.md')) {
    const metadata = body.match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(metadata, `Missing frontmatter: ${path}`);
    const name = metadata[1].match(/^name: ([a-z][a-z0-9-]*)$/m)?.[1];
    assert.equal(name, dirname(path).split('/').at(-1), `Skill name differs from directory: ${path}`);
    assert.match(metadata[1], /^description: .+/m);
  }
}
const manifests = await Promise.all([
  'package.json', 'plugin.json', '.claude-plugin/plugin.json', '.codex-plugin/plugin.json',
].map(async path => JSON.parse(await readFile(resolve(root, path), 'utf8'))));
for (const manifest of manifests) {
  assert.equal(manifest.name, 'planet');
  assert.equal(manifest.version, manifests[0].version);
  assert.equal(manifest.description, manifests[0].description);
}
assert.equal(manifests[3].skills, './skills/');
assert.deepEqual(manifests[0].pi.skills, ['./skills']);
validateScreen(JSON.parse(await readFile(resolve(root, 'skills/planet-visual/assets/example.json'), 'utf8')));
console.log(`Checked ${files.length} files: manifests, skill metadata, references, JavaScript syntax, and visual example.`);

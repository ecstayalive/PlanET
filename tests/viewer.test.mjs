import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { request } from 'node:http';
import { join } from 'node:path';
import test from 'node:test';
import { startViewer } from '../skills/planet-visual/scripts/server.mjs';
import { validateScreen } from '../skills/planet-visual/scripts/screen.mjs';

const decision = { id: 'layout', mode: 'decision', title: '选择布局', choices: [
  { id: 'sidebar', label: '侧边栏' }, { id: 'topbar', label: '顶部导航' },
] };

async function session(t, screen = decision) {
  const directory = await mkdtemp(join(tmpdir(), 'planet-viewer-'));
  await writeFile(join(directory, 'screen.json'), JSON.stringify(screen));
  const viewer = await startViewer({ directory });
  t.after(async () => { viewer.close(); await rm(directory, { recursive: true, force: true }); });
  const url = new URL(viewer.url);
  const headers = { Authorization: `Bearer ${new URLSearchParams(url.hash.slice(1)).get('token')}` };
  return { ...viewer, origin: url.origin, headers };
}

test('authentication, origin checks, and route isolation protect session data', async t => {
  const viewer = await session(t);
  assert.equal((await fetch(`${viewer.origin}/`)).status, 200);
  assert.equal((await fetch(`${viewer.origin}/screen`)).status, 401);
  assert.equal((await fetch(`${viewer.origin}/events`, { headers: { Authorization: 'Bearer invalid' } })).status, 401);
  assert.equal((await fetch(`${viewer.origin}/screen`, { headers: { ...viewer.headers, Origin: 'https://example.org' } })).status, 403);
  const hostStatus = await new Promise((done, reject) => {
    const call = request(`${viewer.origin}/screen`, { headers: { ...viewer.headers, Host: 'attacker.example' } }, response => {
      response.resume();
      done(response.statusCode);
    });
    call.on('error', reject);
    call.end();
  });
  assert.equal(hostStatus, 403);
  assert.equal((await fetch(`${viewer.origin}/screen.json`, { headers: viewer.headers })).status, 404);
  assert.equal((await fetch(`${viewer.origin}/style.css`)).status, 200);
  assert.equal((await fetch(`${viewer.origin}/app.js`)).status, 200);
  const logo = await fetch(`${viewer.origin}/logo.svg`);
  assert.equal(logo.status, 200);
  assert.equal(logo.headers.get('content-type'), 'image/svg+xml');
  assert.match(await logo.text(), /<svg/);
});

test('only explicit valid confirmation writes an answer', async t => {
  const viewer = await session(t);
  const screen = await (await fetch(`${viewer.origin}/screen`, { headers: viewer.headers })).json();
  const answer = { screen: screen.id, revision: screen.revision, choice: 'sidebar', feedback: '采用侧边栏' };
  const request = body => fetch(`${viewer.origin}/confirm`, {
    method: 'POST', headers: viewer.headers, body: JSON.stringify(body),
  });
  assert.equal((await request({ ...answer, choice: 'unknown' })).status, 400);
  assert.equal((await request({ ...answer, choice: undefined, feedback: '' })).status, 400);
  assert.equal((await request(null)).status, 400);
  assert.equal((await fetch(`${viewer.origin}/events`, { headers: viewer.headers })).status, 200);
  const response = await request(answer);
  assert.equal(response.status, 200);
  const confirmed = await response.json();
  assert.equal(confirmed.feedback, '采用侧边栏');
  assert.deepEqual((await readFile(join(viewer.directory, 'events.jsonl'), 'utf8')).trim(), JSON.stringify(confirmed));
  assert.equal((await request(answer)).status, 409);
});

test('changed content rejects an old answer even with the same screen id', async t => {
  const viewer = await session(t);
  const screen = await (await fetch(`${viewer.origin}/screen`, { headers: viewer.headers })).json();
  await writeFile(join(viewer.directory, 'screen.json'), JSON.stringify({ ...decision, summary: 'A new tradeoff' }));
  const response = await fetch(`${viewer.origin}/confirm`, { method: 'POST', headers: viewer.headers,
    body: JSON.stringify({ screen: screen.id, revision: screen.revision, choice: 'sidebar' }) });
  assert.equal(response.status, 409);
  assert.deepEqual(await (await fetch(`${viewer.origin}/events`, { headers: viewer.headers })).json(), []);
});

test('a view cannot be turned into an approval gate through the API', async t => {
  const viewer = await session(t, { id: 'structure', mode: 'view', title: '结构预览' });
  const screen = await (await fetch(`${viewer.origin}/screen`, { headers: viewer.headers })).json();
  const response = await fetch(`${viewer.origin}/confirm`, { method: 'POST', headers: viewer.headers,
    body: JSON.stringify({ screen: screen.id, revision: screen.revision, feedback: 'ok' }) });
  assert.equal(response.status, 409);
});

test('simultaneous confirmations and a restart preserve one answer per revision', async t => {
  const viewer = await session(t);
  const screen = await (await fetch(`${viewer.origin}/screen`, { headers: viewer.headers })).json();
  const body = JSON.stringify({ screen: screen.id, revision: screen.revision, feedback: '选择另外一种布局' });
  const responses = await Promise.all([1, 2].map(() => fetch(`${viewer.origin}/confirm`, {
    method: 'POST', headers: viewer.headers, body,
  })));
  assert.deepEqual(responses.map(response => response.status).sort(), [200, 409]);
  viewer.close();
  const reopened = await startViewer({ directory: viewer.directory });
  t.after(reopened.close);
  const url = new URL(reopened.url);
  const headers = { Authorization: `Bearer ${new URLSearchParams(url.hash.slice(1)).get('token')}` };
  assert.equal((await fetch(`${url.origin}/confirm`, { method: 'POST', headers, body })).status, 409);
  const events = await (await fetch(`${url.origin}/events`, { headers })).json();
  assert.equal(events.length, 1);
  assert.equal(events[0].feedback, '选择另外一种布局');
});

test('SSE announces file updates and closes during shutdown', async t => {
  const viewer = await session(t);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  t.after(() => { clearTimeout(timer); controller.abort(); });
  const response = await fetch(`${viewer.origin}/updates`, { headers: viewer.headers, signal: controller.signal });
  assert.equal(response.headers.get('content-type'), 'text/event-stream');
  const reader = response.body.getReader();
  assert.ok(new TextDecoder().decode((await reader.read()).value).includes('data: update'));
  await writeFile(join(viewer.directory, 'screen.json'), JSON.stringify({ ...decision, title: '新方案' }));
  assert.ok(new TextDecoder().decode((await reader.read()).value).includes('data: update'));
  viewer.close();
  while (!(await reader.read()).done) { /* Drain already buffered update notifications. */ }
});

test('invalid screens and malformed answers produce recoverable responses', async t => {
  const viewer = await session(t);
  await writeFile(join(viewer.directory, 'screen.json'), '{');
  assert.equal((await fetch(`${viewer.origin}/screen`, { headers: viewer.headers })).status, 422);
  await writeFile(join(viewer.directory, 'screen.json'), JSON.stringify({ ...decision, mode: 'unknown' }));
  assert.equal((await fetch(`${viewer.origin}/screen`, { headers: viewer.headers })).status, 422);
  assert.equal((await fetch(`${viewer.origin}/confirm`, { method: 'POST', headers: viewer.headers, body: '{' })).status, 400);
  await writeFile(join(viewer.directory, 'screen.json'), JSON.stringify(decision));
  assert.equal((await fetch(`${viewer.origin}/screen`, { headers: viewer.headers })).status, 200);
  assert.equal((await fetch(`${viewer.origin}/confirm`, { method: 'POST', headers: viewer.headers, body: 'x'.repeat(20_000) })).status, 413);
});

test('agent-authored HTML and optional styles survive the screen protocol', async t => {
  const styles = await readFile(new URL('../skills/planet-visual/assets/style-template.html', import.meta.url), 'utf8');
  assert.doesNotMatch(styles, /<(?:script|form|button|input)\b|https?:\/\//i);
  const html = `${styles}<section><h2>Existing capability and extension</h2><table><tr><td>Existing validation</td><td>Add formatting</td></tr></table><svg viewBox="0 0 100 40"><text x="5" y="20">Shared owner</text></svg></section>`;
  const viewer = await session(t, { id: 'implementation-example', mode: 'view', title: 'Implementation example',
    panels: [{ title: 'Agent-authored explanation', html }] });
  const screen = await (await fetch(`${viewer.origin}/screen`, { headers: viewer.headers })).json();
  assert.equal(screen.panels[0].html, html);
  assert.equal(screen.panels[0].diagram, undefined);
});

test('correction responses are recorded without generic authorization claims', async t => {
  const viewer = await session(t, { id: 'design-review', mode: 'decision', title: 'Review the proposed scope',
    choices: [{ id: 'revise', label: 'Needs changes; do not implement' }] });
  const screen = await (await fetch(`${viewer.origin}/screen`, { headers: viewer.headers })).json();
  const response = await fetch(`${viewer.origin}/confirm`, { method: 'POST', headers: viewer.headers,
    body: JSON.stringify({ screen: screen.id, revision: screen.revision, choice: 'revise', feedback: 'Do not write; revise the design.' }) });
  assert.equal(response.status, 200);
  const reply = await response.json();
  assert.equal(reply.choice, 'revise');
  assert.equal(reply.feedback, 'Do not write; revise the design.');
  assert.equal(Object.hasOwn(reply, 'authorized'), false);
  const client = await (await fetch(`${viewer.origin}/app.js`)).text();
  assert.ok(client.includes('已记录你的回复'));
  assert.ok(!client.includes('已确认并授权'));
});

test('screen validation preserves semantics and rejects conflicting input', () => {
  const screen = validateScreen(decision);
  assert.deepEqual(validateScreen({ ...decision, revision: 'untrusted' }), screen);
  assert.notEqual(validateScreen({ ...decision, title: 'Another layout' }).revision, screen.revision);
  assert.throws(() => validateScreen({ ...decision, mode: 'view' }), /Views/);
  assert.throws(() => validateScreen({ ...decision, choices: [decision.choices[0], decision.choices[0]] }), /unique/);
  assert.throws(() => validateScreen({ ...decision, panels: [{ title: 'Preview', html: {} }] }), /text/);
});

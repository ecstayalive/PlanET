import { randomBytes, timingSafeEqual } from 'node:crypto';
import { watch } from 'node:fs';
import { appendFile, mkdir, readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { validateScreen } from './screen.mjs';

const assets = new Map([
  ['/', ['../public/index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['../public/app.js', 'text/javascript; charset=utf-8']],
  ['/diagram.js', ['../public/diagram.js', 'text/javascript; charset=utf-8']],
  ['/style.css', ['../public/style.css', 'text/css; charset=utf-8']],
  ['/logo.svg', ['../public/logo.svg', 'image/svg+xml']],
]);
const sizeLimit = 1024 * 1024;

export async function startViewer({ directory, port = 0, idleTimeout = 3_600_000 }) {
  directory = resolve(directory);
  await mkdir(directory, { recursive: true });
  const token = randomBytes(32).toString('hex');
  const clients = new Set();
  const answers = new Set();
  let origin;
  let timer;
  let confirmation = Promise.resolve();

  // Disk writes are serialized so two browser tabs cannot confirm the same revision.
  const server = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Content-Security-Policy',
      "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'");
    try {
      if (request.headers.host !== new URL(origin).host ||
          (request.headers.origin && request.headers.origin !== origin)) {
        response.writeHead(403).end();
        return;
      }
      const path = new URL(request.url, origin).pathname;
      if (request.method === 'GET' && assets.has(path)) {
        const [file, type] = assets.get(path);
        const body = await readFile(new URL(file, import.meta.url));
        response.writeHead(200, { 'Content-Type': type }).end(body);
        return;
      }
      const supplied = Buffer.from(request.headers.authorization ?? '');
      const expected = Buffer.from(`Bearer ${token}`);
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
        response.writeHead(401).end();
        return;
      }
      clearTimeout(timer);
      if (idleTimeout > 0) timer = setTimeout(close, idleTimeout).unref();
      if (request.method === 'GET' && path === '/updates') {
        response.writeHead(200, { 'Content-Type': 'text/event-stream', Connection: 'keep-alive' });
        response.write('data: update\n\n');
        clients.add(response);
        response.on('close', () => clients.delete(response));
        return;
      }
      if (request.method === 'GET' && path === '/events') {
        let body = '';
        try { body = await readFile(resolve(directory, 'events.jsonl'), 'utf8'); }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(body.trim() ? body.trim().split('\n').map(line => JSON.parse(line)) : []));
        return;
      }
      if ((request.method === 'GET' && path === '/screen') ||
          (request.method === 'POST' && path === '/confirm')) {
        let answer;
        if (path === '/confirm') {
          const chunks = [];
          let length = 0;
          for await (const chunk of request) {
            chunks.push(chunk);
            length += chunk.length;
            if (length > 16_384) {
              response.writeHead(413).end();
              return;
            }
          }
          try { answer = JSON.parse(Buffer.concat(chunks).toString()); }
          catch { response.writeHead(400).end(); return; }
          if (!answer || typeof answer !== 'object' || Array.isArray(answer)) {
            response.writeHead(400).end();
            return;
          }
          const previous = confirmation;
          let release;
          confirmation = new Promise(done => { release = done; });
          await previous;
          try { await confirm(answer, response); }
          finally { release(); }
          return;
        }
        const screen = await readScreen();
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(screen));
        return;
      }
      response.writeHead(404).end();
    } catch (error) {
      if (!response.headersSent) {
        const status = error.code === 'ENOENT' ? 404 : error instanceof SyntaxError || error.name === 'ScreenError' ? 422 : 500;
        response.writeHead(status, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: status === 500 ? 'Unable to complete viewer request.' : error.message }));
      } else response.end();
    }
  });

  async function readScreen() {
    const body = await readFile(resolve(directory, 'screen.json'), 'utf8');
    if (Buffer.byteLength(body) > sizeLimit) {
      const error = new Error('Screen exceeds the 1 MiB limit.');
      error.name = 'ScreenError';
      throw error;
    }
    try { return validateScreen(JSON.parse(body)); }
    catch (error) { error.name = 'ScreenError'; throw error; }
  }

  async function confirm(answer, response) {
    const screen = await readScreen();
    if (screen.mode !== 'decision' || answer.screen !== screen.id || answer.revision !== screen.revision) {
      response.writeHead(409).end(JSON.stringify({ error: 'This decision has changed. Refresh before answering.' }));
      return;
    }
    const choice = answer.choice;
    const feedback = answer.feedback ?? '';
    const blueprint = answer.blueprint;
    if (typeof feedback !== 'string' || feedback.length > 4000 ||
        (choice !== undefined && !screen.choices?.some(item => item.id === choice)) ||
        (choice === undefined && !feedback.trim() && !blueprint)) {
      response.writeHead(400).end(JSON.stringify({ error: 'Choose a valid option or enter a response.' }));
      return;
    }
    // Also read persisted answers so restarting the viewer does not erase confirmation state.
    let recorded = '';
    try { recorded = await readFile(resolve(directory, 'events.jsonl'), 'utf8'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    for (const line of recorded.trim().split('\n').filter(Boolean)) {
      answers.add(JSON.parse(line).revision);
    }
    if (answers.has(screen.revision)) {
      response.writeHead(409).end(JSON.stringify({ error: 'This decision has already been confirmed.' }));
      return;
    }
    const event = {
      screen: screen.id,
      revision: screen.revision,
      choice,
      feedback: feedback.trim(),
      ...(blueprint !== undefined ? { blueprint } : {}),
      confirmedAt: new Date().toISOString()
    };
    await appendFile(resolve(directory, 'events.jsonl'), `${JSON.stringify(event)}\n`, { mode: 0o600 });
    answers.add(screen.revision);
    response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(event));
  }

  let watcher;
  let pollInterval;
  try {
    watcher = watch(directory, () => {
      for (const client of clients) client.write('data: update\n\n');
    });
    watcher.on('error', close);
  } catch (error) {
    if (error.code !== 'ENOSPC') throw error;
    let lastMtime = 0;
    pollInterval = setInterval(async () => {
      try {
        const stats = await stat(resolve(directory, 'screen.json'));
        if (stats.mtimeMs !== lastMtime) {
          lastMtime = stats.mtimeMs;
          for (const client of clients) client.write('data: update\n\n');
        }
      } catch {}
    }, 1000).unref();
  }

  function close() {
    clearTimeout(timer);
    if (pollInterval) clearInterval(pollInterval);
    watcher?.close();
    for (const client of clients) client.end();
    server.close();
    server.closeAllConnections();
  }

  await new Promise((done, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', done);
  }).catch(error => { close(); throw error; });
  origin = `http://127.0.0.1:${server.address().port}`;
  if (idleTimeout > 0) timer = setTimeout(close, idleTimeout).unref();
  return { server, directory, url: `${origin}/#token=${token}`, close };
}

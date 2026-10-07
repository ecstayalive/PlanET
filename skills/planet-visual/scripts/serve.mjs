import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { startViewer } from './server.mjs';

try {
  const { values } = parseArgs({ options: {
    dir: { type: 'string' },
    port: { type: 'string', default: '0' },
    'idle-ms': { type: 'string', default: '3600000' },
    help: { type: 'boolean' },
  } });
  if (values.help) {
    console.log('Usage: node serve.mjs --dir <session-directory> [--port <port>] [--idle-ms <milliseconds>]');
  } else {
    const port = Number(values.port);
    const idleTimeout = Number(values['idle-ms']);
    if (!values.dir || !Number.isInteger(port) || port < 0 || port > 65535 ||
        !Number.isSafeInteger(idleTimeout) || idleTimeout < 0) {
      throw new Error('Provide --dir, a valid port, and a non-negative idle timeout.');
    }
    const viewer = await startViewer({ directory: resolve(values.dir), port, idleTimeout });
    console.log(JSON.stringify({ type: 'viewer-started', url: viewer.url, directory: viewer.directory }));
    process.once('SIGINT', viewer.close);
    process.once('SIGTERM', viewer.close);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

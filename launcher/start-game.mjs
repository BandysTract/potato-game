import { readFile, open } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
const url = 'http://127.0.0.1:4187/';
const expected = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');

async function ready() {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(500) });
    return response.ok && await response.text() === expected;
  } catch { return false; }
}

if (!await ready()) {
  const log = await open(new URL('./server.log', import.meta.url), 'w');
  const server = spawn(process.execPath, [
    fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)),
    'preview', '--host', '127.0.0.1', '--port', '4187', '--strictPort',
  ], { cwd: root, detached: true, stdio: ['ignore', log.fd, log.fd] });
  server.unref();
  await log.close();
  for (let attempt = 0; attempt < 60 && !await ready(); attempt++) await delay(150);
  if (!await ready()) throw new Error('The game could not start. Check launcher/server.log in the game folder.');
}

if (process.argv.includes('--check')) console.log(url);
else {
  const browser = spawn('/usr/bin/open', [url], { stdio: 'ignore' });
  browser.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
  browser.on('exit', (code) => { process.exitCode = code ?? 1; });
}

// capture2.mjs — captures shots 1-4 as JPGs into screenshots/ and shots 5-6
// into verify-shots/ via Chrome DevTools Protocol (Page.captureScreenshot).
// The --screenshot flag hangs on this VM with a continuous rAF loop, so
// CDP capture is the reliable path. Node standard library only.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = dirname(fileURLToPath(import.meta.url));
const gameDir = join(repo, 'game');
const chrome = join(process.env.HOME, '.cache/ms-playwright/chromium-1255/chrome-linux64/chrome');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = join(gameDir, path === '/' ? 'index.html' : path);
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('nf');
  }
});
await new Promise((r) => server.listen(8095, r));

const proc = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--remote-debugging-port=9224', '--window-size=1280,800', 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target = null;
for (let i = 0; i < 40; i++) {
  await sleep(500);
  try {
    const list = await (await fetch('http://127.0.0.1:9224/json')).json();
    target = list.find((t) => t.type === 'page');
    if (target) break;
  } catch { /* not up yet */ }
}
if (!target) { console.log('FAIL: no CDP target'); process.exit(1); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
});
function send(method, params) {
  return new Promise((resolve) => {
    const mid = ++id;
    pending.set(mid, resolve);
    ws.send(JSON.stringify({ id: mid, method, params: params || {} }));
  });
}
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });

const jobs = [
  [1, 'screenshots/01-cover.jpg'],
  [2, 'screenshots/02-camera.jpg'],
  [3, 'screenshots/03-lockpick.jpg'],
  [4, 'screenshots/04-zipline.jpg'],
  [5, 'verify-shots/05-caught.jpg'],
  [6, 'verify-shots/06-win.jpg'],
];
for (const [shot, out] of jobs) {
  await send('Page.navigate', { url: `http://127.0.0.1:8095/index.html?shot=${shot}` });
  await sleep(1800);
  const ready = await send('Runtime.evaluate', { expression: 'window.__shotReady === true && window.__errors.length === 0', returnByValue: true });
  const shotRes = await send('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
  const data = shotRes.result?.data;
  if (!data) { console.log(`shot ${shot}: CAPTURE FAILED`); continue; }
  const outPath = join(repo, out);
  mkdirSync(dirname(outPath), { recursive: true });
  await writeFile(outPath, Buffer.from(data, 'base64'));
  const { statSync } = await import('node:fs');
  console.log(`shot ${shot}: ${out} ${statSync(outPath).size} bytes, clean=${ready.result?.result?.value}`);
}
ws.close();
proc.kill();
server.close();
console.log('done');

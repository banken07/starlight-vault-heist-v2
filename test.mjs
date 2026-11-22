// test.mjs — headless playtest driver over Chrome DevTools Protocol.
// Node standard library only (global WebSocket + fetch). Drives the real
// game code in the page: checks console errors, speeds, alarm curve,
// vent/balcony walkability, the win path and the caught state.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
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
await new Promise((r) => server.listen(8092, r));

const proc = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--remote-debugging-port=9223', '--window-size=1280,800', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target = null;
for (let i = 0; i < 40; i++) {
  await sleep(500);
  try {
    const list = await (await fetch('http://127.0.0.1:9223/json')).json();
    target = list.find((t) => t.type === 'page');
    if (target) break;
  } catch { /* not up yet */ }
}
if (!target) { console.log('FAIL: no CDP target'); process.exit(1); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const pending = new Map();
const consoleErrors = [];
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  if (msg.method === 'Runtime.exceptionThrown') {
    consoleErrors.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || ''));
  }
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
    consoleErrors.push(msg.params.args.map((a) => a.value || a.description || '').join(' '));
  }
});
function send(method, params) {
  return new Promise((resolve) => {
    const mid = ++id;
    pending.set(mid, resolve);
    ws.send(JSON.stringify({ id: mid, method, params: params || {} }));
  });
}
async function evalJs(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) return { error: r.result.exceptionDetails.text + ' ' + (r.result.exceptionDetails.exception?.description || '') };
  return r.result?.result?.value;
}
await send('Runtime.enable');
await send('Page.enable');

const results = [];
function check(name, ok, detail) {
  results.push([ok ? 'PASS' : 'FAIL', name, detail || '']);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

for (const shot of [0, 1, 2, 3, 4, 5, 6]) {
  await send('Page.navigate', { url: `http://127.0.0.1:8092/index.html?shot=${shot}` });
  await sleep(1500);
  const ready = await evalJs('window.__shotReady === true');
  const errs = await evalJs('window.__errors');
  check(`shot=${shot} loads, no console errors`, ready === true && Array.isArray(errs) && errs.length === 0, `ready=${ready} errors=${JSON.stringify(errs)}`);
}

// --- mechanics on a fresh (unstaged) game ---
await send('Page.navigate', { url: 'http://127.0.0.1:8092/index.html' });
await sleep(1200);
const speeds = await evalJs('({p: SV.PLAYER_SPEED, chase: SV.GUARD_CHASE_SPEED, patrol: SV.GUARD_PATROL_SPEED})');
check('chase speed 2.95 > player run speed 2.6 > patrol 1.2', speeds && speeds.chase > speeds.p && speeds.p > speeds.patrol, JSON.stringify(speeds));

// Alarm rises when seen, decays when unseen.
const alarmTest = await evalJs(`(() => {
  const S = SV.S;
  S.alarm = 0;
  // Rise: keep the player 60px ahead of MARA's facing every frame, so the
  // guard sees the thief but can never close in and catch during the test.
  for (let i = 0; i < 120; i++) {
    const g = S.guards[0];
    S.player.x = g.x + 60; S.player.y = g.y;
    g.facing = 0;
    SV._update(S, 1/60);
    if (S.caught) break;
  }
  const risen = S.alarm;
  S.player.x = 300; S.player.y = 700; // far away, out of every cone
  S.guards[0].suspicion = 0; S.guards[0].state = 'PATROL';
  for (let i = 0; i < 120; i++) SV._update(S, 1/60);
  const decayed = S.alarm;
  return { risen: Math.round(risen), decayed: Math.round(decayed), guardState: S.guards[0].state };
})()`);
check('alarm rises when seen, decays when unseen', alarmTest && alarmTest.risen > 25 && alarmTest.decayed < alarmTest.risen, JSON.stringify(alarmTest));

// Vent walkable in every room: walk the full vent length on foot.
const ventTest = await evalJs(`(() => {
  const out = [];
  for (let r = 0; r < 3; r++) {
    const S = SV.S;
    SV.enterRoom(S, r);
    const room = SV.ROOMS[r];
    const v = room.vents[0];
    const startX = v.w > v.h ? v.x + 30 : v.x + v.w / 2;
    const startY = v.w > v.h ? v.y + v.h / 2 : v.y + 30;
    S.player.x = startX; S.player.y = startY;
    const keys = {};
    const dir = v.w > v.h ? 'd' : 's';
    let steps = 0;
    const target = v.w > v.h ? v.x + v.w - 30 : v.y + v.h - 30;
    while (steps < 600) {
      keys[dir] = true;
      SV.movePlayer(S, room, 1/60, keys);
      steps++;
      const pos = v.w > v.h ? S.player.x : S.player.y;
      if (pos >= target) break;
    }
    const end = v.w > v.h ? S.player.x : S.player.y;
    out.push({ room: r, reached: end >= target, steps });
  }
  return out;
})()`);
check('vent walkable end-to-end in all 3 rooms', Array.isArray(ventTest) && ventTest.every((v) => v.reached), JSON.stringify(ventTest));

// Balcony walkable in every room.
const balcTest = await evalJs(`(() => {
  const out = [];
  for (let r = 0; r < 3; r++) {
    const S = SV.S;
    SV.enterRoom(S, r);
    const room = SV.ROOMS[r];
    const b = room.balconies[0];
    const startX = b.w > b.h ? b.x + 30 : b.x + b.w / 2;
    const startY = b.w > b.h ? b.y + b.h / 2 : b.y + 30;
    S.player.x = startX; S.player.y = startY;
    const keys = {};
    const dir = b.w > b.h ? 'd' : 's';
    let steps = 0;
    const target = b.w > b.h ? b.x + b.w - 30 : b.y + b.h - 30;
    while (steps < 600) {
      keys[dir] = true;
      SV.movePlayer(S, room, 1/60, keys);
      steps++;
      const pos = b.w > b.h ? S.player.x : S.player.y;
      if (pos >= target) break;
    }
    const end = b.w > b.h ? S.player.x : S.player.y;
    out.push({ room: r, reached: end >= target, steps });
  }
  return out;
})()`);
check('balcony walkable end-to-end in all 3 rooms', Array.isArray(balcTest) && balcTest.every((v) => v.reached), JSON.stringify(balcTest));

// Tools buyable at stated costs.
const toolTest = await evalJs(`(() => {
  const S = SV.S;
  SV.resetGame(S);
  S.coins = 40;
  SV.buyTool(S, 'lockpick'); SV.buyTool(S, 'smoke'); SV.buyTool(S, 'lenscap');
  return { coins: S.coins, tools: S.tools };
})()`);
check('tools buyable at 10/15/8 coins', toolTest && toolTest.coins === 7 && toolTest.tools.lockpick === 1 && toolTest.tools.smoke === 1 && toolTest.tools.lenscap === 1, JSON.stringify(toolTest));

// Full win path: loot 1 -> 2 -> lockpick -> diamond -> zipline.
const winTest = await evalJs(`(() => {
  const S = SV.S;
  SV.resetGame(S);
  S.coins = 30;
  SV.buyTool(S, 'lockpick');
  // room 1: take star chart, walk to door, enter room 2
  S.player.x = SV.ROOMS[0].lootPos.x; S.player.y = SV.ROOMS[0].lootPos.y;
  SV.interact(S, SV.ROOMS[0]);
  const gotChart = S.lootTaken[0];
  S.player.x = SV.ROOMS[0].exit.x + 10; S.player.y = SV.ROOMS[0].exit.y + 10;
  SV.interact(S, SV.ROOMS[0]);
  const inRoom2 = S.room === 1;
  // room 2: take brass key, door to room 3
  S.player.x = SV.ROOMS[1].lootPos.x; S.player.y = SV.ROOMS[1].lootPos.y;
  SV.interact(S, SV.ROOMS[1]);
  const gotKey = S.lootTaken[1];
  S.player.x = SV.ROOMS[1].exit.x + 10; S.player.y = SV.ROOMS[1].exit.y + 10;
  SV.interact(S, SV.ROOMS[1]);
  const inRoom3 = S.room === 2;
  // room 3: lockpick case, take diamond, zipline
  S.player.x = SV.ROOMS[2].casePos.x; S.player.y = SV.ROOMS[2].casePos.y + 80;
  SV.interact(S, SV.ROOMS[2]);
  const caseOpen = S.caseOpen;
  S.player.x = SV.ROOMS[2].lootPos.x; S.player.y = SV.ROOMS[2].lootPos.y;
  SV.interact(S, SV.ROOMS[2]);
  const gotDiamond = S.diamondTaken;
  S.player.x = SV.ROOMS[2].zipline.x + 40; S.player.y = SV.ROOMS[2].zipline.y + 30;
  SV.interact(S, SV.ROOMS[2]);
  return { gotChart, inRoom2, gotKey, inRoom3, caseOpen, gotDiamond, won: S.won };
})()`);
check('win path reachable: chart -> key -> lockpick -> diamond -> zipline', winTest && Object.values(winTest).every(Boolean), JSON.stringify(winTest));

// Caught state reachable: chasing guard touches the player.
const caughtTest = await evalJs(`(() => {
  const S = SV.S;
  SV.resetGame(S);
  SV.enterRoom(S, 2);
  const g = S.guards[0];
  g.state = 'CHASE'; g.suspicion = 1;
  g.x = S.player.x + 20; g.y = S.player.y;
  S.alarm = 60;
  for (let i = 0; i < 60 && !S.caught; i++) SV._update(S, 1/60);
  return { caught: S.caught, caughtBy: S.caughtBy };
})()`);
check('caught state reachable by chasing guard touch', caughtTest && caughtTest.caught === true, JSON.stringify(caughtTest));

// Alarm 100 also catches.
const alarm100 = await evalJs(`(() => {
  const S = SV.S;
  SV.resetGame(S);
  S.alarm = 99.5;
  S.player.x = S.guards[0].x + 60; S.player.y = S.guards[0].y;
  S.guards[0].facing = 0;
  for (let i = 0; i < 120 && !S.caught; i++) SV._update(S, 1/60);
  return { caught: S.caught, alarm: Math.round(S.alarm) };
})()`);
check('alarm 100 catches', alarm100 && alarm100.caught === true, JSON.stringify(alarm100));

console.log('page console errors:', JSON.stringify(consoleErrors));
const fails = results.filter((r) => r[0] === 'FAIL').length;
console.log(`\n${results.length - fails}/${results.length} checks passed`);
ws.close();
proc.kill();
server.close();
process.exit(fails ? 1 : 0);

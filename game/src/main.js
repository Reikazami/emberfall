// Entry point: owns the canvas, the frame loop, mouse and keyboard, the Regent's turns and the
// floating numbers. Everything about the rules is in rules.js and ai.js.

import { aiStep } from './ai.js';
import { sound, unlockAudio } from './audio.js';
import { boardRects, H, heroCircle, W } from './layout.js';
import { draw } from './render.js';
import { buildShot } from './shots.js';
import { chooseHand, confirmTarget, cycleMinion, cycleTarget, finishTurn, handleClick, hitTest, newUi, playerCanAct, startDuel } from './ui.js';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
let ui = shot ? buildShot(shot, Number(params.get('seed') ?? 1) || 1) : newUi();
let nextSeed = Number(params.get('seed') ?? 0) || (Date.now() % 100000);

function eventSpot(event) {
  if (event.kind === 'face' || event.type === 'heal') {
    const c = heroCircle(event.side);
    return { x: c.x, y: c.y };
  }
  const count = Math.max(ui.g.sides[event.side].board.length, event.idx + 1);
  const r = boardRects(event.side, count)[event.idx] ?? { x: 600, y: 300, w: 100, h: 130 };
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

function showBanner(text, color) {
  ui.banner = { text, color, t0: ui.time };
}

function processEvents() {
  if (!ui.g) return;
  for (const event of ui.g.events.splice(0)) {
    if (event.type === 'damage') {
      const spot = eventSpot(event);
      ui.floaters.push({ ...spot, text: `-${event.amount}`, color: '#ff6a6a', t0: ui.time });
      sound('hit');
    } else if (event.type === 'heal') {
      const spot = eventSpot(event);
      ui.floaters.push({ ...spot, text: `+${event.amount}`, color: '#7dff9a', t0: ui.time });
      sound('heal');
    } else if (event.type === 'attack') {
      const from = boardRects(event.side, ui.g.sides[event.side].board.length + 1)[event.idx];
      const to = event.target.kind === 'face' ? heroCircle(event.target.side) : eventSpot({ ...event.target, type: 'damage' });
      if (from) ui.lunges.set(event.uid, { t0: ui.time, dx: (to.x - (from.x + from.w / 2)) * 0.45, dy: (to.y - (from.y + from.h / 2)) * 0.45 });
      sound('hit');
    } else if (event.type === 'play') sound('play');
    else if (event.type === 'draw') sound('draw');
    else if (event.type === 'death') sound('death');
    else if (event.type === 'turn') {
      if (event.side === 0) showBanner('Your turn', '#ffe28a');
      else showBanner("The Regent's turn", '#ff9a6a');
      sound('turn');
    }
  }
  ui.floaters = ui.floaters.filter((f) => ui.time - f.t0 < 1.2);
}

function update(dt) {
  ui.time += dt;
  if (ui.phase === 'play') {
    if (ui.aiBusy && ui.time >= ui.aiAt && ui.g.winner === null) {
      const acted = aiStep(ui.g);
      ui.aiAt = ui.time + (acted ? 0.85 : 0);
      if (!acted) ui.aiBusy = false;
    }
    if (ui.g.winner !== null) {
      if (!ui.endAt) ui.endAt = ui.time + 1.3;
      if (ui.time >= ui.endAt) {
        ui.phase = 'end';
        ui.sel = null;
        sound(ui.g.winner === 0 ? 'win' : 'lose');
      }
    }
  }
  processEvents();
}

function pointer(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: ((event.clientX - rect.left) / rect.width) * W, y: ((event.clientY - rect.top) / rect.height) * H };
}

function beginDuel() {
  startDuel(ui, nextSeed++);
}

function backToTitle() {
  const fresh = newUi();
  fresh.time = ui.time;
  ui = fresh;
}

canvas.addEventListener('mousemove', (event) => {
  ui.mouse = pointer(event);
  ui.hover = hitTest(ui, ui.mouse.x, ui.mouse.y);
});

canvas.addEventListener('mousedown', (event) => {
  unlockAudio();
  const p = pointer(event);
  if (event.button === 2) {
    ui.sel = null;
    ui.msg = '';
    return;
  }
  const hit = hitTest(ui, p.x, p.y);
  if (ui.phase === 'title') {
    if (hit && hit.kind === 'start') beginDuel();
    return;
  }
  if (ui.phase === 'end') {
    if (hit && hit.kind === 'again') beginDuel();
    else if (hit && hit.kind === 'title') backToTitle();
    return;
  }
  const before = ui.msg;
  handleClick(ui, hit);
  if (ui.msg && ui.msg !== before && /enough|full|cannot|already|Guard|legal/.test(ui.msg)) sound('refuse');
});

canvas.addEventListener('contextmenu', (event) => event.preventDefault());

window.addEventListener('keydown', (event) => {
  unlockAudio();
  const key = event.key;
  if (ui.phase === 'title') {
    if (key === 'Enter' || key === ' ') beginDuel();
    return;
  }
  if (ui.phase === 'end') {
    if (key === 'r' || key === 'R' || key === 'Enter') beginDuel();
    else if (key === 't' || key === 'T') backToTitle();
    return;
  }
  const picking = ui.sel && (ui.sel.kind === 'minion' || ui.sel.kind === 'hand');
  if (key === 'Escape') {
    ui.sel = null;
    ui.msg = '';
  } else if (key === 'a' || key === 'A') {
    cycleMinion(ui);
  } else if (picking && (key === 'Tab' || key === 'ArrowRight' || key === 'ArrowDown')) {
    event.preventDefault();
    cycleTarget(ui, 1);
  } else if (picking && (key === 'ArrowLeft' || key === 'ArrowUp')) {
    event.preventDefault();
    cycleTarget(ui, -1);
  } else if (picking && (key === ' ' || key === 'Enter')) {
    event.preventDefault();
    confirmTarget(ui);
  } else if (key === ' ' || key === 'e' || key === 'E' || key === 'Enter') {
    event.preventDefault();
    finishTurn(ui);
  } else if (/^[1-7]$/.test(key) && playerCanAct(ui)) {
    chooseHand(ui, Number(key) - 1);
  }
});

let last = performance.now();
function frame(now) {
  update(Math.min(0.1, (now - last) / 1000));
  last = now;
  draw(ctx, ui);
  requestAnimationFrame(frame);
}

if (shot) {
  draw(ctx, ui);
  window.__shotReady = true;
} else {
  requestAnimationFrame(frame);
}

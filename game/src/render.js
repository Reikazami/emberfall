// Paints the whole 1280 by 720 frame for the current interface state: the title screen, the
// table with both hands, boards and heroes, and the victory or defeat screen.

import { CARDS, ELEMENT } from './cards.js';
import { drawCard, drawCardBack, roundRect } from './cardview.js';
import { drawGlyph } from './glyphs.js';
import { canAttack, canPlay, MAX_MANA } from './rules.js';
import {
  AGAIN_BUTTON, boardRects, END_BUTTON, H, handRects, HAND_LIFT, heroCircle, PREVIEW,
  START_BUTTON, TITLE_BUTTON, W,
} from './layout.js';
import { validTargets } from './ui.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';
const HERO_NAMES = ['Warden Vael', 'The Ashen Regent'];
const HERO_ELEMENTS = ['tide', 'ember'];

function drawTable(ctx, t) {
  const sky = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 760);
  sky.addColorStop(0, '#2a5a48');
  sky.addColorStop(0.55, '#173a30');
  sky.addColorStop(1, '#0a1914');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = '#f4e6b8';
  ctx.lineWidth = 2;
  for (let i = -8; i < 24; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 80 + (t * 6) % 80, 0);
    ctx.lineTo(i * 80 + 280 + (t * 6) % 80, H);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  roundRect(ctx, 215, 140, 830, 154, 22);
  ctx.fill();
  roundRect(ctx, 215, 320, 830, 154, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(232,214,160,.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(215, 307);
  ctx.lineTo(1045, 307);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawManaCrystals(ctx, x, y, mana, maxMana) {
  for (let i = 0; i < MAX_MANA; i++) {
    const cx = x + i * 19;
    ctx.beginPath();
    ctx.moveTo(cx, y - 9);
    ctx.lineTo(cx + 7, y);
    ctx.lineTo(cx, y + 9);
    ctx.lineTo(cx - 7, y);
    ctx.closePath();
    if (i < maxMana) {
      ctx.fillStyle = i < mana ? '#4cb4ff' : '#16304f';
      ctx.fill();
      ctx.strokeStyle = '#bfe3ff';
    } else {
      ctx.strokeStyle = 'rgba(191,227,255,.25)';
    }
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawHero(ctx, ui, side) {
  const g = ui.g;
  const s = g.sides[side];
  const c = heroCircle(side);
  const targets = validTargets(ui);
  const isTarget = targets.some((t) => t.side === side && t.kind === 'face');
  const hovered = ui.hover && ui.hover.kind === 'hero' && ui.hover.side === side;
  const active = g.turn === side && g.winner === null;
  ctx.save();
  if (isTarget) {
    ctx.shadowColor = '#ffd85e';
    ctx.shadowBlur = 24 + 8 * Math.sin(ui.time * 6);
  } else if (active) {
    ctx.shadowColor = side === 0 ? '#62e6ff' : '#ff8a4a';
    ctx.shadowBlur = 16;
  }
  const el = ELEMENT[HERO_ELEMENTS[side]];
  const grad = ctx.createRadialGradient(c.x - 12, c.y - 14, 4, c.x, c.y, c.r);
  grad.addColorStop(0, el.light);
  grad.addColorStop(1, el.dark);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = isTarget && hovered ? 6 : 4;
  ctx.strokeStyle = isTarget ? '#ffd85e' : '#e8d6a0';
  ctx.stroke();
  drawGlyph(ctx, HERO_ELEMENTS[side], c.x, c.y - 2, c.r * 0.5, el.glyph);
  ctx.restore();

  const lifeX = c.x + c.r * 0.72;
  const lifeY = c.y + (side === 1 ? c.r * 0.7 : -c.r * 0.7);
  ctx.save();
  ctx.fillStyle = s.life <= 6 ? '#e23131' : '#b3203f';
  ctx.beginPath();
  ctx.arc(lifeX, lifeY, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffd0d8';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `bold 26px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(Math.max(0, s.life)), lifeX, lifeY + 1);

  const labelY = side === 1 ? c.y + c.r + 22 : c.y + c.r + 20;
  ctx.fillStyle = '#f7ecd0';
  ctx.font = `bold 16px ${FONT}`;
  ctx.fillText(HERO_NAMES[side], c.x, labelY);
  drawManaCrystals(ctx, c.x - 66, labelY + 24, s.mana, s.maxMana);
  ctx.fillStyle = '#bcd6c9';
  ctx.font = `13px ${FONT}`;
  ctx.fillText(`Mana ${s.mana}/${s.maxMana}  ·  Deck ${s.deck.length}`, c.x, labelY + 46);
  ctx.restore();
}

function drawOpponentHand(ctx, g) {
  const count = g.sides[1].hand.length;
  const w = 58;
  const h = 82;
  const spacing = 52;
  const startX = 640 - ((count - 1) * spacing + w) / 2;
  for (let i = 0; i < count; i++) drawCardBack(ctx, startX + i * spacing, -34, w, h);
}

function boardCard(ctx, ui, side, idx, rect) {
  const g = ui.g;
  const m = g.sides[side].board[idx];
  const targets = validTargets(ui);
  const isTarget = targets.some((t) => t.side === side && t.kind === 'minion' && t.idx === idx);
  const selected = ui.sel && ui.sel.kind === 'minion' && side === 0 && ui.sel.idx === idx;
  const ready = side === 0 && g.turn === 0 && canAttack(g, 0, idx);
  const hovered = ui.hover && ui.hover.kind === 'board' && ui.hover.side === side && ui.hover.idx === idx;
  let glow = null;
  if (isTarget) glow = hovered ? 'red' : 'gold';
  else if (selected) glow = 'cyan';
  else if (ready) glow = 'green';
  const lift = hovered && !isTarget ? -6 : 0;
  const lunge = ui.lunges.get(m.uid);
  let ox = 0;
  let oy = 0;
  if (lunge) {
    const k = (ui.time - lunge.t0) / 0.4;
    if (k >= 0 && k <= 1) {
      ox = lunge.dx * Math.sin(k * Math.PI);
      oy = lunge.dy * Math.sin(k * Math.PI);
    }
  }
  drawCard(ctx, {
    card: m.card, x: rect.x + ox, y: rect.y + lift + oy, w: rect.w, h: rect.h, style: 'mini',
    atk: m.atk, hp: m.hp, maxhp: m.maxhp, glow, sleepy: m.sick && g.turn === side,
  });
}

function drawBoards(ctx, ui) {
  const g = ui.g;
  for (const side of [1, 0]) {
    const rects = boardRects(side, g.sides[side].board.length);
    rects.forEach((rect, idx) => boardCard(ctx, ui, side, idx, rect));
  }
}

function drawHand(ctx, ui) {
  const g = ui.g;
  const hand = g.sides[0].hand;
  const rects = handRects(hand.length);
  rects.forEach((rect, idx) => {
    const card = CARDS[hand[idx]];
    const playable = g.turn === 0 && g.winner === null && canPlay(g, 0, idx) === 'ok';
    const selected = ui.sel && ui.sel.kind === 'hand' && ui.sel.idx === idx;
    const hovered = ui.hover && ui.hover.kind === 'hand' && ui.hover.idx === idx;
    const lift = selected ? HAND_LIFT + 8 : hovered ? HAND_LIFT : 0;
    drawCard(ctx, {
      card, x: rect.x, y: rect.y - lift, w: rect.w, h: rect.h, style: 'full',
      glow: selected ? 'cyan' : playable ? 'gold' : null,
      dim: g.turn === 0 && !playable, costBad: card.cost > g.sides[0].mana,
    });
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.font = `bold 12px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(String(idx + 1), rect.x + rect.w / 2, rect.y - lift - 6);
  });
}

function drawEndButton(ctx, ui) {
  const g = ui.g;
  const mine = g.turn === 0 && g.winner === null && !ui.aiBusy;
  const b = END_BUTTON;
  const hovered = ui.hover && ui.hover.kind === 'end';
  ctx.save();
  roundRect(ctx, b.x, b.y, b.w, b.h, 14);
  const grad = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
  if (mine) {
    grad.addColorStop(0, hovered ? '#f9d56a' : '#e8b93f');
    grad.addColorStop(1, '#a8741a');
  } else {
    grad.addColorStop(0, '#4a4f55');
    grad.addColorStop(1, '#2a2d31');
  }
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = mine ? '#fff0b8' : '#6c727a';
  ctx.stroke();
  ctx.fillStyle = mine ? '#2a1a04' : '#a5adb5';
  ctx.font = `bold 22px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(mine ? 'END TURN' : g.winner !== null ? 'Duel over' : 'Regent thinks…', b.x + b.w / 2, b.y + b.h / 2 - (mine ? 6 : 0));
  if (mine) {
    ctx.font = `12px ${FONT}`;
    ctx.fillText('Space / E', b.x + b.w / 2, b.y + b.h / 2 + 16);
  }
  ctx.fillStyle = '#e7dfc3';
  ctx.font = `bold 15px ${FONT}`;
  ctx.fillText(`Turn ${Math.ceil(g.turnNum / 2)}`, b.x + b.w / 2, b.y - 16);
  ctx.restore();
}

function drawMessageBar(ctx, ui) {
  const g = ui.g;
  const text = ui.msg || g.log[g.log.length - 1] || '';
  if (!text) return;
  ctx.save();
  ctx.font = `bold 16px ${FONT}`;
  const w = Math.min(760, ctx.measureText(text).width + 44);
  roundRect(ctx, 640 - w / 2 - 20, 484, w, 34, 17);
  ctx.fillStyle = 'rgba(8,12,10,.7)';
  ctx.fill();
  ctx.fillStyle = ui.msg ? '#ffe28a' : '#d9e8de';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 640 - 20, 502);
  ctx.restore();
}

function drawPreview(ctx, ui) {
  const h = ui.hover;
  if (!h || h.kind !== 'board') return;
  const m = ui.g.sides[h.side].board[h.idx];
  if (!m) return;
  drawCard(ctx, {
    card: m.card, x: PREVIEW.x, y: PREVIEW.y, w: PREVIEW.w, h: PREVIEW.h, style: 'full',
    atk: m.atk, hp: m.hp, maxhp: m.maxhp,
  });
}

function drawTargetArrow(ctx, ui) {
  if (!ui.sel || ui.sel.kind !== 'minion') return;
  const rect = boardRects(0, ui.g.sides[0].board.length)[ui.sel.idx];
  if (!rect) return;
  const sx = rect.x + rect.w / 2;
  const sy = rect.y + 8;
  ctx.save();
  ctx.strokeStyle = '#62e6ff';
  ctx.lineWidth = 5;
  ctx.setLineDash([12, 8]);
  ctx.lineDashOffset = -ui.time * 40;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ui.mouse.x, ui.mouse.y);
  ctx.stroke();
  ctx.restore();
}

function drawFloaters(ctx, ui) {
  for (const f of ui.floaters) {
    const age = ui.time - f.t0;
    if (age < 0 || age > 1.1) continue;
    ctx.save();
    ctx.globalAlpha = Math.min(1, (1.1 - age) * 2);
    ctx.fillStyle = f.color;
    ctx.strokeStyle = 'rgba(0,0,0,.7)';
    ctx.lineWidth = 5;
    ctx.font = `bold ${f.size ?? 34}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const y = f.y - age * 46;
    ctx.strokeText(f.text, f.x, y);
    ctx.fillText(f.text, f.x, y);
    ctx.restore();
  }
}

function drawBanner(ctx, ui) {
  if (!ui.banner) return;
  const age = ui.time - ui.banner.t0;
  if (age > 1.5) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, (1.5 - age) * 2.5, age * 6);
  const w = 440;
  roundRect(ctx, 640 - w / 2, 250, w, 82, 16);
  ctx.fillStyle = 'rgba(10,8,18,.82)';
  ctx.fill();
  ctx.strokeStyle = '#e8d6a0';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = ui.banner.color;
  ctx.font = `bold 40px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ui.banner.text, 640, 292);
  ctx.restore();
}

function drawButton(ctx, rect, label, hovered, primary) {
  ctx.save();
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 14);
  const grad = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  grad.addColorStop(0, primary ? (hovered ? '#f9d56a' : '#e8b93f') : hovered ? '#59647a' : '#3d465a');
  grad.addColorStop(1, primary ? '#a8741a' : '#222836');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = primary ? '#fff0b8' : '#9aa6bf';
  ctx.stroke();
  ctx.fillStyle = primary ? '#2a1a04' : '#eef2fb';
  ctx.font = `bold 22px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
  ctx.restore();
}

function drawEndScreen(ctx, ui) {
  const won = ui.g.winner === 0;
  ctx.save();
  ctx.fillStyle = 'rgba(6,4,12,.72)';
  ctx.fillRect(0, 0, W, H);
  const panel = { x: 340, y: 150, w: 600, h: 410 };
  roundRect(ctx, panel.x, panel.y, panel.w, panel.h, 26);
  const grad = ctx.createLinearGradient(0, panel.y, 0, panel.y + panel.h);
  grad.addColorStop(0, won ? '#4b3a10' : '#3d1520');
  grad.addColorStop(1, '#150d1c');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = won ? '#ffd85e' : '#e0566f';
  ctx.stroke();
  drawGlyph(ctx, won ? 'ember' : 'tide', 640, 238, 46, won ? '#ffd85e' : '#e0566f');
  ctx.fillStyle = won ? '#ffe28a' : '#ff8aa0';
  ctx.font = `bold 78px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(won ? 'VICTORY' : 'DEFEAT', 640, 332);
  ctx.fillStyle = '#f0e8d4';
  ctx.font = `20px ${FONT}`;
  const line = won ? 'The Ashen Regent falls. The embers are yours.' : 'You fall to the Ashen Regent. The embers go cold.';
  ctx.fillText(line, 640, 388);
  ctx.fillStyle = '#c9bfa6';
  ctx.font = `bold 17px ${FONT}`;
  const [a, b] = ui.g.sides;
  ctx.fillText(`Turns ${Math.ceil(ui.g.turnNum / 2)}  ·  Your life ${Math.max(0, a.life)}  ·  Regent life ${Math.max(0, b.life)}`, 640, 426);
  const hover = ui.hover;
  drawButton(ctx, AGAIN_BUTTON, 'Play again (R)', hover && hover.kind === 'again', true);
  drawButton(ctx, TITLE_BUTTON, 'Title (T)', hover && hover.kind === 'title', false);
  ctx.restore();
}

function drawTitle(ctx, ui) {
  const t = ui.time;
  drawTable(ctx, t);
  ctx.save();
  const names = ['phoenix', 'wave', 'titan', 'drake', 'fireball'];
  names.forEach((id, i) => {
    const spread = (i - 2) * 190;
    const rot = (i - 2) * 0.13;
    ctx.save();
    ctx.translate(640 + spread, 430 + Math.abs(i - 2) * 22 + Math.sin(t * 1.4 + i) * 5);
    ctx.rotate(rot);
    drawCard(ctx, { card: CARDS[id], x: -90, y: -128, w: 180, h: 256, style: 'full', atk: CARDS[id].atk, hp: CARDS[id].hp });
    ctx.restore();
  });
  ctx.restore();
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const title = ctx.createLinearGradient(0, 40, 0, 150);
  title.addColorStop(0, '#fff2b8');
  title.addColorStop(1, '#e07a2c');
  ctx.shadowColor = 'rgba(0,0,0,.7)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = title;
  ctx.font = `bold 112px ${FONT}`;
  ctx.fillText('EMBERFALL', 640, 96);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#d8ead9';
  ctx.font = `italic 26px ${FONT}`;
  ctx.fillText('A duel of four elements. Spend mana, summon minions, break the Regent.', 640, 170);
  ctx.fillStyle = 'rgba(8,12,10,.62)';
  roundRect(ctx, 250, 214, 780, 56, 14);
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.font = `bold 17px ${FONT}`;
  ctx.fillText('Click a card to play it  ·  Click a ready minion, then a foe to attack  ·  Guard minions must fall first', 640, 235);
  ctx.fillStyle = '#c9dccd';
  ctx.font = `15px ${FONT}`;
  ctx.fillText('Keys 1-7 play cards  ·  Space ends your turn  ·  Esc cancels  ·  Reduce the Regent from 20 life to 0', 640, 256);
  ctx.restore();
  drawButton(ctx, START_BUTTON, 'Begin duel (Enter)', ui.hover && ui.hover.kind === 'start', true);
}

export function draw(ctx, ui) {
  if (ui.phase === 'title') {
    drawTitle(ctx, ui);
    return;
  }
  drawTable(ctx, ui.time);
  drawOpponentHand(ctx, ui.g);
  drawHero(ctx, ui, 1);
  drawHero(ctx, ui, 0);
  drawBoards(ctx, ui);
  drawTargetArrow(ctx, ui);
  drawMessageBar(ctx, ui);
  drawEndButton(ctx, ui);
  drawHand(ctx, ui);
  drawPreview(ctx, ui);
  drawFloaters(ctx, ui);
  drawBanner(ctx, ui);
  if (ui.phase === 'end') drawEndScreen(ctx, ui);
}


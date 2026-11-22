// Draws one card, as a full hand card, a compact board minion, or a card back.

import { ELEMENT, KEYWORD_TEXT } from './cards.js';
import { drawGlyph } from './glyphs.js';
import { hashString } from './rng.js';

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function fitText(ctx, text, maxWidth, startSize, weight = 'bold') {
  let size = startSize;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > 7) {
    size -= 0.5;
    ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  }
  return size;
}

export function wrapLines(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = trial;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function badge(ctx, cx, cy, r, fill, rim, label, fontScale = 1.15) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.5)';
  ctx.shadowBlur = r * 0.4;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = Math.max(1.5, r * 0.14);
  ctx.strokeStyle = rim;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(r * fontScale)}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(label), cx, cy + r * 0.05);
  ctx.restore();
}

export function drawCardBack(ctx, x, y, w, h) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.5)';
  ctx.shadowBlur = w * 0.1;
  roundRect(ctx, x, y, w, h, w * 0.09);
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, '#3a1c52');
  grad.addColorStop(1, '#1b1030');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = w * 0.04;
  ctx.strokeStyle = '#c9a659';
  ctx.stroke();
  ctx.globalAlpha = 0.85;
  drawGlyph(ctx, 'ember', x + w / 2, y + h / 2, w * 0.26, '#c9a659');
  ctx.restore();
}

const GLOW = { gold: '#ffd85e', cyan: '#62e6ff', red: '#ff5a5a', green: '#7dff8a' };

// o: { card, x, y, w, h, style: 'full' | 'mini', atk, hp, maxhp, glow, dim, sleepy, costBad }
export function drawCard(ctx, o) {
  const { card, x, y, w, h } = o;
  const el = ELEMENT[card.element];
  const mini = o.style === 'mini';
  ctx.save();
  if (o.glow) {
    ctx.shadowColor = GLOW[o.glow];
    ctx.shadowBlur = w * 0.22;
  } else {
    ctx.shadowColor = 'rgba(0,0,0,.55)';
    ctx.shadowBlur = w * 0.08;
    ctx.shadowOffsetY = w * 0.03;
  }
  roundRect(ctx, x, y, w, h, w * 0.08);
  const body = ctx.createLinearGradient(x, y, x, y + h);
  body.addColorStop(0, el.mid);
  body.addColorStop(1, el.dark);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = w * 0.03;
  ctx.strokeStyle = o.glow ? GLOW[o.glow] : '#e8d6a0';
  ctx.stroke();

  const ribbonY = y + h * 0.045;
  const ribbonH = h * (mini ? 0.14 : 0.115);
  const ribbonX = x + (mini ? w * 0.07 : w * 0.27);
  const ribbonW = w * (mini ? 0.86 : 0.67);
  ctx.fillStyle = 'rgba(12,8,20,.62)';
  roundRect(ctx, ribbonX, ribbonY, ribbonW, ribbonH, ribbonH * 0.4);
  ctx.fill();
  ctx.fillStyle = '#fff6df';
  fitText(ctx, card.name, ribbonW * 0.92, mini ? w * 0.105 : w * 0.092);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(card.name, ribbonX + ribbonW / 2, ribbonY + ribbonH / 2 + 0.5);

  if (!mini) badge(ctx, x + w * 0.14, y + h * 0.095, w * 0.115, o.costBad ? '#7c1d1d' : '#1f4aa8', '#cfe3ff', card.cost);

  const ax = x + w * 0.08;
  const ay = y + (mini ? h * 0.22 : h * 0.2);
  const aw = w * 0.84;
  const ah = h * (mini ? 0.42 : 0.37);
  ctx.save();
  roundRect(ctx, ax, ay, aw, ah, w * 0.05);
  ctx.clip();
  const art = ctx.createRadialGradient(ax + aw / 2, ay + ah * 0.55, 2, ax + aw / 2, ay + ah / 2, aw * 0.75);
  art.addColorStop(0, el.light);
  art.addColorStop(1, el.dark);
  ctx.fillStyle = art;
  ctx.fillRect(ax, ay, aw, ah);
  const seed = hashString(card.id);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = el.glyph;
  for (let i = 0; i < 7; i++) {
    const sx = ax + ((seed >>> (i * 3)) % 97) / 97 * aw;
    const sy = ay + ((seed >>> (i * 2 + 1)) % 89) / 89 * ah;
    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(1, w * (0.008 + (i % 3) * 0.006)), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 0.95;
  drawGlyph(ctx, card.element, ax + aw / 2, ay + ah / 2, Math.min(ah * 0.36, aw * 0.3), el.glyph);
  ctx.restore();
  ctx.lineWidth = Math.max(1, w * 0.014);
  ctx.strokeStyle = 'rgba(255,240,200,.55)';
  roundRect(ctx, ax, ay, aw, ah, w * 0.05);
  ctx.stroke();

  const tx = x + w * 0.08;
  const ty = ay + ah + h * 0.025;
  const tw = w * 0.84;
  const th = mini ? h * 0.1 : h * 0.205;
  ctx.fillStyle = 'rgba(14,9,22,.74)';
  roundRect(ctx, tx, ty, tw, th, w * 0.04);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (mini) {
    const tags = card.keywords.map((k) => k.toUpperCase()).join(' · ') || card.type.toUpperCase();
    ctx.fillStyle = '#ffe9a8';
    fitText(ctx, tags, tw * 0.95, w * 0.09);
    ctx.fillText(tags, tx + tw / 2, ty + th / 2 + 0.5);
  } else {
    const kind = card.type === 'minion' ? ['Minion', ...card.keywords.map((k) => k[0].toUpperCase() + k.slice(1))].join(' · ') : 'Spell';
    ctx.fillStyle = '#ffd98a';
    ctx.font = `bold ${Math.round(w * 0.078)}px "Trebuchet MS", Verdana, sans-serif`;
    ctx.fillText(kind, tx + tw / 2, ty + th * 0.18);
    ctx.fillStyle = '#f6efe0';
    ctx.font = `${Math.round(w * 0.078)}px "Trebuchet MS", Verdana, sans-serif`;
    const body = card.type === 'spell' ? card.text : card.keywords.length ? KEYWORD_TEXT[card.keywords[0]] : card.text;
    const lines = wrapLines(ctx, body, tw * 0.92).slice(0, 3);
    lines.forEach((line, i) => ctx.fillText(line, tx + tw / 2, ty + th * (0.4 + i * 0.22)));
  }

  if (card.type === 'minion') {
    const atk = o.atk ?? card.atk;
    const hp = o.hp ?? card.hp;
    const damaged = o.maxhp !== undefined && hp < o.maxhp;
    const boosted = atk > card.atk || (o.maxhp !== undefined && o.maxhp > card.hp);
    const r = w * (mini ? 0.15 : 0.135);
    badge(ctx, x + w * 0.16, y + h - r * 0.55, r, boosted && atk > card.atk ? '#2f8f2f' : '#b8791a', '#ffe7a8', atk);
    badge(ctx, x + w * 0.84, y + h - r * 0.55, r, damaged ? '#d12a2a' : '#a31f3d', '#ffc4cf', hp);
  } else {
    ctx.fillStyle = 'rgba(12,8,20,.7)';
    roundRect(ctx, x + w * 0.3, y + h - h * 0.075, w * 0.4, h * 0.07, h * 0.03);
    ctx.fill();
    ctx.fillStyle = '#ffd98a';
    ctx.font = `bold ${Math.round(w * 0.07)}px "Trebuchet MS", Verdana, sans-serif`;
    ctx.fillText('SPELL', x + w / 2, y + h - h * 0.04);
  }

  if (o.dim) {
    ctx.fillStyle = 'rgba(8,6,14,.45)';
    roundRect(ctx, x, y, w, h, w * 0.08);
    ctx.fill();
  }
  if (o.sleepy) {
    ctx.fillStyle = '#e8f1ff';
    ctx.font = `bold ${Math.round(w * 0.2)}px "Trebuchet MS", Verdana, sans-serif`;
    ctx.fillText('zZ', x + w * 0.78, y + h * 0.3);
  }
  ctx.restore();
}

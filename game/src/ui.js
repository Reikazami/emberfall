// Interface state and what a click or key does to it: selecting cards and minions, choosing
// targets, ending the turn. The rules live in rules.js, the drawing in render.js.

import { CARDS, isTargetedSpell } from './cards.js';
import { attack, attackTargets, canAttack, canPlay, endTurn, newGame, playCard, spellTargets } from './rules.js';
import {
  AGAIN_BUTTON, boardRects, END_BUTTON, handRects, HAND_LIFT, heroCircle, inCircle, inRect, START_BUTTON,
  TITLE_BUTTON,
} from './layout.js';

export function newUi() {
  return {
    phase: 'title', g: null, sel: null, hover: null, mouse: { x: 640, y: 360 }, floaters: [],
    msg: '', banner: null, lunges: new Map(), time: 0, aiBusy: false, aiAt: 0, endAt: 0,
  };
}

export function startDuel(ui, seed) {
  ui.g = newGame(seed);
  ui.phase = 'play';
  ui.sel = null;
  ui.floaters = [];
  ui.msg = '';
  ui.aiBusy = false;
  ui.endAt = 0;
}

export function validTargets(ui) {
  if (!ui.g || !ui.sel || ui.phase !== 'play' || ui.g.winner !== null) return [];
  if (ui.sel.kind === 'minion') return attackTargets(ui.g, 0);
  const id = ui.g.sides[0].hand[ui.sel.idx];
  if (id && isTargetedSpell(CARDS[id])) return spellTargets(ui.g, 0);
  return [];
}

export function hitTest(ui, x, y) {
  if (ui.phase === 'title') return inRect(START_BUTTON, x, y) ? { kind: 'start' } : null;
  if (ui.phase === 'end') {
    if (inRect(AGAIN_BUTTON, x, y)) return { kind: 'again' };
    if (inRect(TITLE_BUTTON, x, y)) return { kind: 'title' };
    return null;
  }
  if (inRect(END_BUTTON, x, y)) return { kind: 'end' };
  const hand = handRects(ui.g.sides[0].hand.length);
  for (let i = hand.length - 1; i >= 0; i--) {
    const r = hand[i];
    if (inRect({ x: r.x, y: r.y - HAND_LIFT - 8, w: r.w, h: r.h + HAND_LIFT + 8 }, x, y)) return { kind: 'hand', idx: i };
  }
  for (const side of [0, 1]) {
    const rects = boardRects(side, ui.g.sides[side].board.length);
    for (let i = rects.length - 1; i >= 0; i--) if (inRect(rects[i], x, y)) return { kind: 'board', side, idx: i };
  }
  for (const side of [0, 1]) if (inCircle(heroCircle(side), x, y)) return { kind: 'hero', side };
  return null;
}

export function playerCanAct(ui) {
  return ui.phase === 'play' && ui.g.turn === 0 && ui.g.winner === null && !ui.aiBusy;
}

export function finishTurn(ui) {
  if (!playerCanAct(ui)) return;
  ui.sel = null;
  ui.msg = '';
  endTurn(ui.g);
  ui.aiBusy = ui.g.winner === null && ui.g.turn === 1;
  ui.aiAt = ui.time + 1.1;
}

const REFUSALS = {
  mana: 'Not enough mana for that card.',
  board: 'Your side of the table is full.',
};

export function chooseHand(ui, idx) {
  if (!playerCanAct(ui)) return;
  ui.msg = '';
  if (ui.sel && ui.sel.kind === 'hand' && ui.sel.idx === idx) {
    ui.sel = null;
    return;
  }
  const verdict = canPlay(ui.g, 0, idx);
  if (verdict !== 'ok') {
    ui.msg = REFUSALS[verdict] ?? '';
    ui.sel = null;
    return;
  }
  const card = CARDS[ui.g.sides[0].hand[idx]];
  if (isTargetedSpell(card)) {
    ui.sel = { kind: 'hand', idx };
    ui.msg = `Choose a target for ${card.name}.`;
    return;
  }
  ui.sel = null;
  playCard(ui.g, 0, idx);
}

function chooseMinion(ui, idx) {
  if (ui.sel && ui.sel.kind === 'minion' && ui.sel.idx === idx) {
    ui.sel = null;
    return;
  }
  if (canAttack(ui.g, 0, idx)) {
    ui.sel = { kind: 'minion', idx };
    ui.msg = 'Choose a foe to attack.';
  } else {
    const m = ui.g.sides[0].board[idx];
    ui.msg = m.attacked ? `${m.card.name} has already attacked.` : `${m.card.name} cannot attack yet.`;
    ui.sel = null;
  }
}

function chooseTarget(ui, target) {
  const legal = validTargets(ui).some((t) => t.side === target.side && t.kind === target.kind && (t.kind === 'face' || t.idx === target.idx));
  if (!legal) {
    ui.msg = ui.sel.kind === 'minion' ? 'A Guard minion must be struck first.' : 'That is not a legal target.';
    return;
  }
  const sel = ui.sel;
  ui.sel = null;
  if (sel.kind === 'minion') attack(ui.g, 0, sel.idx, target);
  else playCard(ui.g, 0, sel.idx, target);
}

export function handleClick(ui, hit) {
  if (!playerCanAct(ui)) return;
  ui.msg = '';
  if (!hit) {
    ui.sel = null;
    return;
  }
  if (hit.kind === 'end') {
    finishTurn(ui);
    return;
  }
  const foeHit = (hit.kind === 'board' || hit.kind === 'hero') && hit.side === 1;
  if (ui.sel && foeHit) {
    chooseTarget(ui, hit.kind === 'hero' ? { side: 1, kind: 'face', idx: -1 } : { side: 1, kind: 'minion', idx: hit.idx });
    return;
  }
  if (hit.kind === 'hand') chooseHand(ui, hit.idx);
  else if (hit.kind === 'board' && hit.side === 0) chooseMinion(ui, hit.idx);
  else ui.sel = null;
}

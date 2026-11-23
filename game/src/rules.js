// The rules of an Emberfall duel. Pure functions over a plain state object, no drawing here.
// Side 0 is the player, side 1 is the opponent. A target is { side, kind: 'face' | 'minion', idx }.

import { CARDS, DECK_LIST, hasKeyword, isTargetedSpell } from './cards.js';
import { makeRng, shuffle } from './rng.js';

export const START_LIFE = 20;
export const MAX_HAND = 7;
export const MAX_BOARD = 5;
export const MAX_MANA = 8;
export const OPENING_HAND = 4;

function makeSide() {
  return { life: START_LIFE, deck: [], hand: [], board: [], mana: 0, maxMana: 0, fatigue: 0 };
}

export function newGame(seed) {
  const rng = makeRng(seed);
  const g = { seed, rng, sides: [makeSide(), makeSide()], turn: 0, turnNum: 0, winner: null, events: [], log: [], nextUid: 1 };
  for (const side of g.sides) {
    side.deck = shuffle(DECK_LIST.slice(), rng);
    const count = side === g.sides[0] ? OPENING_HAND : OPENING_HAND + 1;
    for (let i = 0; i < count; i++) side.hand.push(side.deck.pop());
  }
  beginTurn(g);
  return g;
}

function note(g, text) {
  g.log.push(text);
  if (g.log.length > 40) g.log.shift();
}

function emit(g, event) {
  g.events.push(event);
}

export function beginTurn(g) {
  const me = g.sides[g.turn];
  g.turnNum++;
  me.maxMana = Math.min(MAX_MANA, me.maxMana + 1);
  me.mana = me.maxMana;
  for (const m of me.board) {
    m.sick = false;
    m.attacked = false;
  }
  if (g.turnNum > 1) drawCards(g, g.turn, 1); // the opener skips their first draw
  emit(g, { type: 'turn', side: g.turn });
}

export function drawCards(g, sideIdx, count) {
  const side = g.sides[sideIdx];
  for (let i = 0; i < count && g.winner === null; i++) {
    if (side.deck.length === 0) {
      side.fatigue++;
      note(g, `${sideName(sideIdx)} has no cards left and takes ${side.fatigue} damage.`);
      hurtFace(g, sideIdx, side.fatigue);
      continue;
    }
    const id = side.deck.pop();
    if (side.hand.length >= MAX_HAND) {
      note(g, `${sideName(sideIdx)} burns ${CARDS[id].name}: the hand is full.`);
      emit(g, { type: 'burn', side: sideIdx, id });
    } else {
      side.hand.push(id);
      emit(g, { type: 'draw', side: sideIdx });
    }
  }
}

export function sideName(idx) {
  return idx === 0 ? 'Vael' : 'The Regent';
}

function checkWinner(g) {
  if (g.winner !== null) return;
  const dead0 = g.sides[0].life <= 0;
  const dead1 = g.sides[1].life <= 0;
  if (dead0 && dead1) g.winner = 1 - g.turn;
  else if (dead0) g.winner = 1;
  else if (dead1) g.winner = 0;
}

function hurtFace(g, sideIdx, amount) {
  g.sides[sideIdx].life -= amount;
  emit(g, { type: 'damage', side: sideIdx, kind: 'face', idx: -1, amount });
  checkWinner(g);
}

function hurtMinion(g, sideIdx, idx, amount) {
  const m = g.sides[sideIdx].board[idx];
  if (!m) return;
  m.hp -= amount;
  emit(g, { type: 'damage', side: sideIdx, kind: 'minion', idx, amount });
}

function sweepDead(g) {
  for (let s = 0; s < 2; s++) {
    const board = g.sides[s].board;
    for (let i = board.length - 1; i >= 0; i--) {
      if (board[i].hp <= 0) {
        note(g, `${board[i].card.name} falls.`);
        emit(g, { type: 'death', side: s, idx: i });
        board.splice(i, 1);
      }
    }
  }
}

function makeMinion(g, card) {
  return {
    uid: g.nextUid++,
    card,
    atk: card.atk,
    hp: card.hp,
    maxhp: card.hp,
    sick: !hasKeyword(card, 'swift'),
    attacked: false,
  };
}

// Puts a minion straight onto a side's board (used to stage showcase positions).
export function summon(g, sideIdx, cardId, ready) {
  const m = makeMinion(g, CARDS[cardId]);
  m.sick = !ready;
  g.sides[sideIdx].board.push(m);
  return m;
}

export function guardIndexes(g, sideIdx) {
  const out = [];
  g.sides[sideIdx].board.forEach((m, i) => {
    if (hasKeyword(m.card, 'guard')) out.push(i);
  });
  return out;
}

export function canAttack(g, sideIdx, idx) {
  const m = g.sides[sideIdx].board[idx];
  return !!m && g.winner === null && g.turn === sideIdx && !m.sick && !m.attacked && m.atk > 0;
}

export function attackTargets(g, sideIdx) {
  const foe = 1 - sideIdx;
  const guards = guardIndexes(g, foe);
  if (guards.length > 0) return guards.map((idx) => ({ side: foe, kind: 'minion', idx }));
  const targets = g.sides[foe].board.map((_, idx) => ({ side: foe, kind: 'minion', idx }));
  targets.push({ side: foe, kind: 'face', idx: -1 });
  return targets;
}

export function spellTargets(g, sideIdx) {
  const foe = 1 - sideIdx;
  const targets = g.sides[foe].board.map((_, idx) => ({ side: foe, kind: 'minion', idx }));
  targets.push({ side: foe, kind: 'face', idx: -1 });
  return targets;
}

function sameTarget(a, b) {
  return a && b && a.side === b.side && a.kind === b.kind && (a.kind === 'face' || a.idx === b.idx);
}

export function canPlay(g, sideIdx, handIdx) {
  if (g.winner !== null || g.turn !== sideIdx) return 'wait';
  const side = g.sides[sideIdx];
  const id = side.hand[handIdx];
  if (!id) return 'empty';
  const card = CARDS[id];
  if (card.cost > side.mana) return 'mana';
  if (card.type === 'minion' && side.board.length >= MAX_BOARD) return 'board';
  return 'ok';
}

export function playCard(g, sideIdx, handIdx, target) {
  if (canPlay(g, sideIdx, handIdx) !== 'ok') return false;
  const side = g.sides[sideIdx];
  const card = CARDS[side.hand[handIdx]];
  if (isTargetedSpell(card) && !spellTargets(g, sideIdx).some((t) => sameTarget(t, target))) return false;
  side.hand.splice(handIdx, 1);
  side.mana -= card.cost;
  emit(g, { type: 'play', side: sideIdx, id: card.id });
  if (card.type === 'minion') {
    side.board.push(makeMinion(g, card));
    note(g, `${sideName(sideIdx)} summons ${card.name}.`);
    return true;
  }
  const fx = card.effect;
  note(g, `${sideName(sideIdx)} casts ${card.name}.`);
  if (fx.kind === 'damage') {
    if (target.kind === 'face') hurtFace(g, target.side, fx.amount);
    else hurtMinion(g, target.side, target.idx, fx.amount);
  } else if (fx.kind === 'heal') {
    side.life = Math.min(START_LIFE, side.life + fx.amount);
    emit(g, { type: 'heal', side: sideIdx, amount: fx.amount });
    if (fx.draw) drawCards(g, sideIdx, fx.draw);
  } else if (fx.kind === 'draw') {
    drawCards(g, sideIdx, fx.amount);
  } else if (fx.kind === 'sweep') {
    const foe = 1 - sideIdx;
    g.sides[foe].board.forEach((_, i) => hurtMinion(g, foe, i, fx.amount));
  } else if (fx.kind === 'buff') {
    for (const m of side.board) {
      m.atk += fx.atk;
      m.hp += fx.hp;
      m.maxhp += fx.hp;
    }
  }
  sweepDead(g);
  return true;
}

export function attack(g, sideIdx, idx, target) {
  if (!canAttack(g, sideIdx, idx)) return false;
  if (!attackTargets(g, sideIdx).some((t) => sameTarget(t, target))) return false;
  const me = g.sides[sideIdx];
  const mine = me.board[idx];
  mine.attacked = true;
  emit(g, { type: 'attack', side: sideIdx, idx, uid: mine.uid, target });
  if (target.kind === 'face') {
    note(g, `${mine.card.name} strikes ${sideName(target.side)} for ${mine.atk}.`);
    hurtFace(g, target.side, mine.atk);
  } else {
    const theirs = g.sides[target.side].board[target.idx];
    note(g, `${mine.card.name} fights ${theirs.card.name}.`);
    const dealt = mine.atk;
    const taken = theirs.atk;
    hurtMinion(g, target.side, target.idx, dealt);
    hurtMinion(g, sideIdx, idx, taken);
  }
  sweepDead(g);
  return true;
}

export function endTurn(g) {
  if (g.winner !== null) return;
  g.turn = 1 - g.turn;
  beginTurn(g);
}

export function readyAttackers(g, sideIdx) {
  const out = [];
  g.sides[sideIdx].board.forEach((_, i) => {
    if (canAttack(g, sideIdx, i)) out.push(i);
  });
  return out;
}

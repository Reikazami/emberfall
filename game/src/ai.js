// The Regent. aiStep does one action for whichever side holds the turn and returns true, or ends
// the turn and returns false when nothing improves the position.
//
// Each step it lists every legal action (every playable card with every target, every ready attacker
// with every target), plays each one out on a scratch copy of the table, scores the resulting
// position, and takes the best. The score is life lead, body count and card count, so it trades
// well, clears Guards for lethal, heals when it matters and spends its mana.

import { CARDS, hasKeyword, isTargetedSpell } from './cards.js';
import { attack, attackTargets, canAttack, canPlay, endTurn, playCard, spellTargets } from './rules.js';

const LETHAL = 1e6;

function worth(m) {
  const base = m.atk * 1.5 + m.hp * 1.1 + (hasKeyword(m.card, 'guard') ? 1.5 : 0) + (hasKeyword(m.card, 'swift') ? 1 : 0);
  return base + (m.atk > 0 ? 1 : 0);
}

function scratch(g) {
  return {
    ...g,
    sides: g.sides.map((s) => ({ ...s, deck: s.deck.slice(), hand: s.hand.slice(), board: s.board.map((m) => ({ ...m })) })),
    events: [],
    log: [],
  };
}

function lifeValue(life) {
  // Life is worth more the closer it is to zero.
  return life + (life <= 8 ? (8 - life) * 0.8 : 0);
}

function evaluate(g, me) {
  if (g.winner === me) return LETHAL;
  if (g.winner !== null) return -LETHAL;
  const mine = g.sides[me];
  const foe = g.sides[1 - me];
  let score = (lifeValue(mine.life) - lifeValue(foe.life)) * 0.6;
  for (const m of mine.board) score += worth(m);
  for (const m of foe.board) score -= worth(m) * 1.05;
  score += (mine.hand.length - foe.hand.length) * 2.6;
  score += mine.deck.length < 4 ? -1 : 0;
  return score;
}

function actions(g, me) {
  const out = [];
  const side = g.sides[me];
  side.hand.forEach((id, handIdx) => {
    if (canPlay(g, me, handIdx) !== 'ok') return;
    const card = CARDS[id];
    if (isTargetedSpell(card)) for (const target of spellTargets(g, me)) out.push({ kind: 'play', handIdx, target, cost: card.cost });
    else out.push({ kind: 'play', handIdx, target: undefined, cost: card.cost });
  });
  side.board.forEach((_, idx) => {
    if (!canAttack(g, me, idx)) return;
    for (const target of attackTargets(g, me)) out.push({ kind: 'attack', idx, target, cost: 0 });
  });
  return out;
}

function apply(g, me, a) {
  return a.kind === 'play' ? playCard(g, me, a.handIdx, a.target) : attack(g, me, a.idx, a.target);
}

export function aiStep(g) {
  const me = g.turn;
  if (g.winner !== null) return false;
  const base = evaluate(g, me);
  let best = null;
  for (const a of actions(g, me)) {
    const trial = scratch(g);
    if (!apply(trial, me, a)) continue;
    // Spending mana is progress in itself; a held card is only worth a little more than a spent one.
    const score = evaluate(trial, me) + a.cost * 0.7;
    if (!best || score > best.score) best = { score, a };
  }
  if (best && (best.score > base || best.score >= LETHAL / 2)) {
    if (apply(g, me, best.a)) return true;
  }
  endTurn(g);
  return false;
}

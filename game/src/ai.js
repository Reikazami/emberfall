// The Regent: a greedy opponent. aiStep does one action for whichever side holds the turn and
// returns true, or ends the turn and returns false when it has nothing worth doing.

import { CARDS, hasKeyword } from './cards.js';
import { attack, attackTargets, canPlay, endTurn, playCard, readyAttackers } from './rules.js';

function worth(m) {
  return m.atk * 1.4 + m.hp + (hasKeyword(m.card, 'guard') ? 2 : 0) + (hasKeyword(m.card, 'swift') ? 1 : 0);
}

function readyDamage(g, sideIdx) {
  return readyAttackers(g, sideIdx).reduce((sum, i) => sum + g.sides[sideIdx].board[i].atk, 0);
}

function scorePlay(g, sideIdx, handIdx) {
  const side = g.sides[sideIdx];
  const foe = g.sides[1 - sideIdx];
  const card = CARDS[side.hand[handIdx]];
  if (canPlay(g, sideIdx, handIdx) !== 'ok') return null;
  if (card.type === 'minion') return { score: card.cost * 10 + card.atk + card.hp, target: null };
  const fx = card.effect;
  if (fx.kind === 'damage') {
    if (foe.life <= fx.amount) return { score: 1000, target: { side: 1 - sideIdx, kind: 'face', idx: -1 } };
    if (foe.life <= readyDamage(g, sideIdx) + fx.amount && foe.board.length === 0) {
      return { score: 900, target: { side: 1 - sideIdx, kind: 'face', idx: -1 } };
    }
    let best = null;
    foe.board.forEach((m, idx) => {
      if (m.hp <= fx.amount && (!best || worth(m) > best.value)) best = { idx, value: worth(m) };
    });
    if (best) return { score: 8 + best.value * 1.5, target: { side: 1 - sideIdx, kind: 'minion', idx: best.idx } };
    if (foe.life <= 8) return { score: 20, target: { side: 1 - sideIdx, kind: 'face', idx: -1 } };
    return null;
  }
  if (fx.kind === 'heal') return side.life <= 12 ? { score: 25, target: null } : null;
  if (fx.kind === 'draw') return side.hand.length <= 5 ? { score: 12, target: null } : null;
  if (fx.kind === 'sweep') {
    const kills = foe.board.filter((m) => m.hp <= fx.amount).length;
    return foe.board.length >= 2 ? { score: 15 * kills + 5 * foe.board.length, target: null } : null;
  }
  if (fx.kind === 'buff') return side.board.length >= 2 ? { score: 14 + 2 * side.board.length, target: null } : null;
  return null;
}

function bestPlay(g, sideIdx) {
  let best = null;
  g.sides[sideIdx].hand.forEach((id, handIdx) => {
    const pick = scorePlay(g, sideIdx, handIdx);
    if (!pick) return;
    const total = pick.score + CARDS[id].cost * 0.01;
    if (!best || total > best.total) best = { total, handIdx, target: pick.target };
  });
  return best;
}

function bestAttack(g, sideIdx) {
  const attackers = readyAttackers(g, sideIdx);
  if (attackers.length === 0) return null;
  const foe = g.sides[1 - sideIdx];
  const board = g.sides[sideIdx].board;
  attackers.sort((a, b) => board[b].atk - board[a].atk);
  const targets = attackTargets(g, sideIdx);
  const guarded = targets.every((t) => t.kind === 'minion') && targets.length > 0 && foe.board.some((m) => hasKeyword(m.card, 'guard'));
  const face = targets.find((t) => t.kind === 'face');
  if (face && readyDamage(g, sideIdx) >= foe.life) return { idx: attackers[0], target: face };
  for (const idx of attackers) {
    const mine = board[idx];
    let pick = null;
    let pickScore = -Infinity;
    for (const t of targets) {
      if (t.kind !== 'minion') continue;
      const theirs = foe.board[t.idx];
      const kills = mine.atk >= theirs.hp;
      const dies = theirs.atk >= mine.hp;
      let score = -Infinity;
      if (kills && !dies) score = 100 + worth(theirs);
      else if (kills && dies && worth(theirs) >= worth(mine)) score = 50 + worth(theirs) - worth(mine);
      else if (guarded) score = (kills ? 10 : 0) - theirs.hp;
      if (score > pickScore) {
        pickScore = score;
        pick = t;
      }
    }
    if (pick) return { idx, target: pick };
    if (face) return { idx, target: face };
  }
  return null;
}

export function aiStep(g) {
  const sideIdx = g.turn;
  if (g.winner !== null) return false;
  const play = bestPlay(g, sideIdx);
  if (play) {
    const target = play.target ?? undefined;
    if (playCard(g, sideIdx, play.handIdx, target)) return true;
  }
  const swing = bestAttack(g, sideIdx);
  if (swing && attack(g, sideIdx, swing.idx, swing.target)) return true;
  endTurn(g);
  return false;
}


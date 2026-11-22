// Fixed positions for the maker's screenshots: index.html?shot=start|play|win|loss&seed=N renders
// one still frame of the real game, so the screenshots under screenshots/ come from this code.

import { newUi, startDuel } from './ui.js';
import { boardRects, heroCircle } from './layout.js';
import { summon } from './rules.js';

// A mid-duel position built with the game's own rules: full boards, a full hand, Guard minions in the way.
function stageMidDuel(ui) {
  const g = ui.g;
  const [me, foe] = g.sides;
  for (const id of ['hound', 'golem', 'hawk', 'caller', 'imp']) summon(g, 0, id, id !== 'imp');
  for (const id of ['warden', 'brute', 'fox', 'titan']) summon(g, 1, id, true);
  me.board[1].hp = 4;
  foe.board[1].hp = 2;
  me.hand = ['fireball', 'phoenix', 'wave', 'growth', 'drake', 'mend', 'leviathan'];
  foe.hand.length = 5;
  me.life = 16;
  foe.life = 11;
  me.maxMana = 8;
  me.mana = 8;
  foe.maxMana = 7;
  g.turn = 0;
  g.turnNum = 15;
  g.log.push('The Regent summons Granite Titan.');
  g.events.length = 0;
  ui.sel = { kind: 'minion', idx: 2 };
  const titan = boardRects(1, foe.board.length)[3];
  ui.mouse = { x: titan.x + titan.w / 2, y: titan.y + titan.h / 2 };
  ui.hover = { kind: 'board', side: 1, idx: 3 };
  const face = heroCircle(1);
  const mid = boardRects(0, me.board.length)[0];
  ui.floaters.push({ x: face.x, y: face.y + 30, text: '-4', color: '#ff6a6a', t0: ui.time - 0.2 });
  ui.floaters.push({ x: mid.x + mid.w / 2, y: mid.y + 40, text: '-2', color: '#ff6a6a', t0: ui.time - 0.35 });
}

export function buildShot(name, seed) {
  const ui = newUi();
  ui.time = 3;
  if (name === 'start') return ui;
  startDuel(ui, seed);
  stageMidDuel(ui);
  if (name === 'play') return ui;
  ui.sel = null;
  ui.hover = null;
  ui.floaters = [];
  if (name === 'win') {
    ui.g.sides[1].life = 0;
    ui.g.winner = 0;
  } else {
    ui.g.sides[0].life = 0;
    ui.g.winner = 1;
  }
  ui.phase = 'end';
  return ui;
}

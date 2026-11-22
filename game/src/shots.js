// Fixed positions for the maker's screenshots: index.html?shot=start|play|win|loss&seed=N renders
// one still frame of the real game, so the screenshots under screenshots/ come from this code.

import { aiStep } from './ai.js';
import { newUi, startDuel } from './ui.js';
import { boardRects } from './layout.js';

function playUntil(ui, turnNum) {
  const g = ui.g;
  while (g.winner === null && !(g.turnNum >= turnNum && g.turn === 0)) {
    let guard = 0;
    while (aiStep(g) && guard++ < 200);
  }
  g.events.length = 0;
}

export function buildShot(name, seed) {
  const ui = newUi();
  ui.time = 3;
  if (name === 'start') return ui;
  startDuel(ui, seed);
  playUntil(ui, 9);
  ui.g.events.length = 0;
  ui.banner = null;
  if (name === 'play') {
    const foes = ui.g.sides[1].board;
    const mine = ui.g.sides[0].board;
    const ready = mine.findIndex((m) => !m.sick && !m.attacked && m.atk > 0);
    if (ready >= 0 && foes.length > 0) {
      ui.sel = { kind: 'minion', idx: ready };
      const rect = boardRects(1, foes.length)[0];
      ui.mouse = { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
      ui.hover = { kind: 'board', side: 1, idx: 0 };
    }
    return ui;
  }
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

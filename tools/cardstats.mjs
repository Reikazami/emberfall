// Win rate of games in which a side played each card at least once, to spot over/under-tuned cards.
import { newGame } from '../game/src/rules.js';
import { aiStep } from '../game/src/ai.js';
import { CARDS } from '../game/src/cards.js';
const N = Number(process.argv[2] ?? 2000);
const st = {};
for (let seed = 1; seed <= N; seed++) {
  const g = newGame(seed); const played = [new Set(), new Set()]; let steps = 0;
  while (g.winner === null && steps++ < 4000) {
    aiStep(g);
    for (const e of g.events) if (e.type === 'play') played[e.side].add(e.id);
    if (g.events.length > 200) g.events.length = 0;
  }
  if (g.winner === null) continue;
  for (const s of [0, 1]) for (const id of played[s]) { st[id] ??= [0, 0]; st[id][1]++; if (g.winner === s) st[id][0]++; }
}
const rows = Object.entries(st).map(([id, [w, n]]) => ({ id, el: CARDS[id].element, cost: CARDS[id].cost, wr: +(w / n).toFixed(3), n }));
rows.sort((a, b) => b.wr - a.wr);
console.table(rows);
const el = {};
for (const r of rows) { el[r.el] ??= [0, 0]; el[r.el][0] += r.wr * r.n; el[r.el][1] += r.n; }
console.log(Object.fromEntries(Object.entries(el).map(([k, [a, b]]) => [k, +(a / b).toFixed(3)])));

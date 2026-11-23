// Head-to-head: the original greedy Regent (tools/ai-v1.mjs) against the current one, seats swapped.
import { newGame } from '../game/src/rules.js';
import { aiStep as current } from '../game/src/ai.js';
import { aiStep as legacy } from './ai-v1.mjs';
const N = Number(process.argv[2] ?? 400);
let curWins = 0; const bySeat = [0, 0];
for (let seed = 1; seed <= N; seed++) {
  const curSeat = seed % 2; // alternate which seat the new AI sits in
  const g = newGame(seed); let steps = 0;
  while (g.winner === null && steps++ < 4000) (g.turn === curSeat ? current : legacy)(g);
  if (g.winner === curSeat) curWins++;
  if (g.winner !== null) bySeat[g.winner]++;
}
console.log({ newAiWinRate: +(curWins / N).toFixed(3), seatWins: bySeat });

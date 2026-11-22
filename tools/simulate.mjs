// Plays many AI-vs-AI duels to check the rules never hang or crash and neither seat dominates.
import { newGame } from '../game/src/rules.js';
import { aiStep } from '../game/src/ai.js';
const wins = [0, 0]; let turns = 0; let stuck = 0;
for (let seed = 1; seed <= 300; seed++) {
  const g = newGame(seed); let steps = 0;
  while (g.winner === null && steps++ < 4000) aiStep(g);
  if (g.winner === null) stuck++; else { wins[g.winner]++; turns += g.turnNum; }
}
console.log({ wins, stuck, avgTurns: turns / (300 - stuck) });

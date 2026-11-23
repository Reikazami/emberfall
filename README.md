# emberfall

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Reikazami/emberfall/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Reikazami/emberfall/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

Emberfall is an original browser card duel: spend mana to summon minions of four elements, cast spells, and break the Ashen Regent from 20 life to 0. It plays offline with mouse and keyboard from plain static files.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080.

## Playing

Mouse: click a card to play it, click a ready minion then a foe to attack. Keyboard: 1-7 play cards, A picks a minion, Tab/arrows pick a target, Enter strikes, Space ends the turn, Esc cancels.

## Tools

`node tools/simulate.mjs` (seat balance), `node tools/cardstats.mjs` (per-card win rates), `node tools/versus.mjs` (current Regent against the original greedy one in `tools/ai-v1.mjs`).

---

<sub>Entered on [make.fun](https://make.fun/?ref=sezgqmhe&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>

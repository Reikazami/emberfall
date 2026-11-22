// Emberfall hands itself in: copy game/ and screenshots/ to the output folder and write the dossier
// the judge reads. Node 22, standard library plus the vendored make.fun library.
// Run it with: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Refuse to hand in half an entry: the page must exist and there must be 3 or 4 screenshots.
function checkEntry(): void {
  if (!existsSync(join(here, 'game', 'index.html'))) throw new Error('game/index.html is missing');
  const shots = readdirSync(join(here, 'screenshots')).filter((name) => /\.(png|jpe?g)$/i.test(name));
  if (shots.length < 3 || shots.length > 4) throw new Error(`screenshots/ needs 3 or 4 images, found ${shots.length}`);
}

checkEntry();
mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's caps from the kit's rules: the text budget shapes the dossier's bytes, the rest refuse oversize entries.
const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

writeFileSync(join(out, 'dossier.json'), buildDossier(out, caps));

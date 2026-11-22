// main.ts — hands Starlight Vault in: copies game/ and screenshots/ from
// this repository to the output directory and writes dossier.json with
// buildDossier from vendor/makefun-game.ts. Node standard library only.
import { cpSync, mkdirSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

// Fail loudly instead of handing in a half-empty output directory.
for (const needed of ['game', 'screenshots']) {
  if (!existsSync(join(repoRoot, needed))) {
    throw new Error('missing required directory in repository: ' + needed);
  }
}
if (!existsSync(join(repoRoot, 'game', 'index.html'))) {
  throw new Error('missing required file in repository: game/index.html');
}

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

// Short run summary so a local run shows what was handed in.
function countFiles(dir) {
  let n = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    n += e.isDirectory() ? countFiles(join(dir, e.name)) : 1;
  }
  return n;
}
console.log('Starlight Vault dossier written to ' + join(outDir, 'dossier.json'));
console.log('game files: ' + countFiles(join(outDir, 'game')) +
  ', screenshots: ' + countFiles(join(outDir, 'screenshots')) +
  ', dossier bytes: ' + statSync(join(outDir, 'dossier.json')).size);

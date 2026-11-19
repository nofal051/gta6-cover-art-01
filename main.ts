// Vice Nights Cover Press — the hand-in program (Node 22, stdlib only).
//
// It hands the entry in: it copies this repository's app/ and
// screenshots/ into the output directory and writes dossier.json there
// with the make.fun library vendored under vendor/. Outside the grader,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The grader runs this program twice and both runs must write the same
// bytes, so it reads only its own repository and writes only the output
// directory, in a fixed order, with nothing time- or random-dependent.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The scorer's caps, from the gate (reference/gate.json): text_max_bytes
// shapes the dossier text; the rest refuse an entry the scorer would
// refuse — more than 4 screenshots or one over 256 KiB, more than 993
// files in app/ or 48 MiB of app files in all, or a path under app/
// longer than 1000 bytes.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

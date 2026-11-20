// Vice Nights Cover Press — entry program (part one: the copy step).
// Copies app/ and screenshots/ into the output directory and writes
// dossier.json with the kit's buildDossier. Node 22 standard library only,
// no network, no install. The verification + summary block is added in a
// second pass below the copy step.

import { cpSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { buildDossier } from "./vendor/makefun-app.ts";

const root = resolve(import.meta.dirname);
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || "/output");

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function handIn() {
  mkdirSync(outDir, { recursive: true });
  const appOut = join(outDir, "app");
  const shotsOut = join(outDir, "screenshots");
  rmSync(appOut, { recursive: true, force: true });
  rmSync(shotsOut, { recursive: true, force: true });
  cpSync(join(root, "app"), appOut, { recursive: true });
  if (existsSync(join(root, "screenshots"))) {
    cpSync(join(root, "screenshots"), shotsOut, { recursive: true });
  }
  return outDir;
}

// Second pass: build the dossier, verify it, and log a one-line summary.
function verifyAndSummarize(dir) {
  const dossier = buildDossier(dir, caps);
  writeFileSync(join(dir, "dossier.json"), dossier);
  const bytes = statSync(join(dir, "dossier.json")).size;
  if (bytes > 1572864) {
    throw new Error(`dossier.json is ${bytes} bytes, over the 1.5 MiB cap`);
  }
  const appEntries = statSync(join(dir, "app")).isDirectory() ? "ok" : "missing";
  console.log(
    `Vice Nights Cover Press handed in: app/ ${appEntries}, dossier.json ${bytes} bytes, out=${dir}`,
  );
}

handIn();
verifyAndSummarize(outDir);

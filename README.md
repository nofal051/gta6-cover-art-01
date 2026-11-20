# Vice Nights Cover Press

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/nofal051/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/nofal051/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn any photo and a caption into a GTA-style multi-panel cover poster, right in your browser — no upload, no account, no network. Your photos stay on your machine, and the cover you export is a real PNG you can post anywhere.

## What it makes

A poster in the Vice City spirit: several photo panels under one big caption block, a sunset or neon colour grade washed over the whole thing, film grain, a thin white frame with corner ticks, and bold lettering. The same painter draws the live preview and the exported PNG, so the file you download looks exactly like what you saw on screen.

## How to use it

1. **Photo** — load your own photo from your machine, or tap one of the three built-in sample scenes (Boulevard, Neon Street, Pier). One photo can fill every panel, or untick the box and give each panel its own photo.
2. **Layout** — pick one of six layouts:
   - **Hero + Three** — one big hero panel with three stacked beside it
   - **2 x 2 Grid** — four equal panels
   - **Full Bleed** — a single photo edge to edge, caption overlaid on a scrim
   - **Triple Strip** — three tall vertical strips
   - **Duo Split** — two tall halves
   - **Diagonal Split** — a hero panel with a slanted cut, two stacked panels on the right
3. **Colour grade** — seven grades: Sunset, Neon Night, Golden Hour, Dusk Violet, Palm Noir, Vice Dusk, and Candy Floss (bubblegum pink and cyan).
4. **Caption** — tap one of five one-tap presets (Vice Nights, Neon Coast, Golden Hour, Pier Pressure, Midnight Run), or type your own title, subtitle and chips. Typing your own text clears the preset. Caption size comes in S / M / L, and the text shadow can be toggled off.
5. **Crop & position** — click a panel to select it, drag it to pan the photo, scroll or use the zoom slider to zoom in. Each panel keeps its own pan and zoom.
6. **Export** — pick Square 1080 x 1080, Portrait 1080 x 1350, or Wide 1920 x 1080, then hit **Export PNG**. The file renders at full size and downloads straight to your machine.

## Run it

```sh
node serve.ts
```

Then open <http://localhost:8080> in desktop Chrome. Everything the app loads — scripts, styles, fonts, sample photos — is a file under `app/`, so it works with the network off. It needs no build step and no install.

## Files

- `app/index.html` — the editor page
- `app/src/main.js` — editor wiring: controls, photo loading, pan/zoom, export
- `app/src/cover.js` — the cover painter: layouts, grades, captions, grain, frame
- `app/src/shots.js` — the four screenshot scenes (`?shot=...`)
- `app/style.css` — editor chrome
- `app/fonts/` — Anton and Pacifico under the SIL Open Font License (`OFL.txt`)
- `app/samples/` — three procedural sample photos drawn for this app
- `main.ts` — hands the app in: copies `app/` and `screenshots/` to the output dir and writes `dossier.json`
- `serve.ts` — the tiny static server above
- `shots.json` — the four screenshot definitions

## Originality

All lettering is Anton and Pacifico, shipped under the SIL Open Font License. The sample photos are procedural drawings made for this entry. Nothing here is a Rockstar Games logo, wordmark, artwork, character or font.

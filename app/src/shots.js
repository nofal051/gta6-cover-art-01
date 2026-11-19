// Vice Nights Cover Press — deterministic screenshot scenes.
//
// ?shot=cover paints one exported cover full-frame: the app's own drawing
// of the PNG it exports, at the export size. ?shot=editor shows the normal
// editor with a photo loaded. Every scene takes its photo, caption,
// layout, grade and size from the query string, waits for the fonts and
// the photos, then sets window.__shotReady so a headless browser knows
// the frame is done.

import { drawCover, SIZES, CAPTION_PRESETS, CAPTION_SIZES, applyCaptionPresetToState } from './cover.js';

const SHOT_SAMPLES = {
  boulevard: 'samples/boulevard.jpg',
  neon: 'samples/neon.jpg',
  pier: 'samples/pier.jpg',
};

export function applyShotParams(state, params) {
  const layout = params.get('layout');
  if (layout) state.layout = layout;
  const grade = params.get('grade');
  if (grade) state.grade = grade;
  const size = params.get('size');
  if (size && SIZES[size]) state.size = size;
  const caption = params.get('caption');
  if (caption) state.title = caption;
  const subtitle = params.get('subtitle');
  if (subtitle !== null) state.subtitle = subtitle;
  const keywords = params.get('keywords');
  if (keywords) state.keywords = keywords.split(',').map((s) => s.trim()).filter(Boolean);
  applyCaptionShotParams(state, params);
}

// New-shot knobs for the fix round: a caption preset, a caption size
// and the shadow toggle, all readable from the shot query string so a
// screenshot can show the new features exactly as the editor shows them.
export function applyCaptionShotParams(state, params) {
  const preset = params.get('preset');
  if (preset && CAPTION_PRESETS[preset]) {
    const applied = applyCaptionPresetToState(state, preset);
    if (applied && params.get('caption')) state.title = params.get('caption');
    if (applied && params.get('subtitle') !== null && params.get('subtitle') !== undefined) {
      state.subtitle = params.get('subtitle');
    }
  }
  const captionSize = params.get('captionSize');
  if (captionSize && CAPTION_SIZES[captionSize]) state.captionSize = captionSize;
  const shadow = params.get('captionShadow');
  if (shadow === 'off' || shadow === 'false' || shadow === '0') state.captionShadow = false;
  if (shadow === 'on' || shadow === 'true' || shadow === '1') state.captionShadow = true;
}

export async function loadShotPhotos(state, params, loadSamples, loadImage) {
  const photo = params.get('photo') || 'pier';
  await loadSamples(state);
  if (!SHOT_SAMPLES[photo]) return;
  const img = await loadImage(SHOT_SAMPLES[photo]);
  state.panels[0].img = img;
  // Fill the other panels with the remaining samples, so no two panels
  // in a row repeat the same photo.
  const rest = ['boulevard', 'neon', 'pier'].filter((key) => key !== photo);
  for (let i = 1; i < state.panels.length; i++) {
    state.panels[i].img = await loadImage(SHOT_SAMPLES[rest[(i - 1) % rest.length]]);
  }
}

export function markReady() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.__shotReady = true;
    });
  });
}

export async function runCoverShot(state, canvas, params, loadSamples, loadImage) {
  applyShotParams(state, params);
  await document.fonts.ready;
  await loadShotPhotos(state, params, loadSamples, loadImage);
  const size = SIZES[state.size];
  document.body.classList.add('shot-cover');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas.getContext('2d'), state, size.w, size.h);
  markReady();
}

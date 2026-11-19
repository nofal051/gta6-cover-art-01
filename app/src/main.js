// Vice Nights Cover Press — editor wiring.
//
// Owns the page state and the DOM: it loads the sample photos and the
// user's own photos, wires every control to a live re-render, pans and
// zooms the selected panel from pointer input, and exports exact-size
// PNGs. The deterministic screenshot scenes live in shots.js and call
// into the helpers here.

import { drawCover, layoutPanels, LAYOUTS, GRADES, SIZES } from './cover.js';
import { runCoverShot, applyShotParams, loadShotPhotos, markReady } from './shots.js';

export const SAMPLES = {
  boulevard: { file: 'samples/boulevard.jpg', label: 'Boulevard sunset' },
  neon: { file: 'samples/neon.jpg', label: 'Neon street' },
  pier: { file: 'samples/pier.jpg', label: 'Pier at golden hour' },
};

const DEFAULT_KEYWORDS = ['SUNSET', 'HEIST', 'NEON', 'PALMS'];

export function freshState() {
  const panels = [];
  for (let i = 0; i < 4; i++) panels.push({ img: null, zoom: 1, ox: 0, oy: 0 });
  return {
    layout: 'hero-three',
    grade: 'sunset',
    size: 'wide',
    title: 'SUNSET HEIST',
    subtitle: 'one last score',
    keywords: [...DEFAULT_KEYWORDS],
    panels,
    selected: 0,
  };
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + src));
    img.src = src;
  });
}

async function loadSamples(state) {
  const keys = ['boulevard', 'neon', 'pier', 'boulevard'];
  for (let i = 0; i < 4; i++) {
    try {
      state.panels[i].img = await loadImage(SAMPLES[keys[i]].file);
    } catch {
      state.panels[i].img = null;
    }
  }
}

// Draws the current state into the on-screen preview canvas, scaled to
// fit at most 880px wide / 560px tall. Returns the preview size.
export function renderPreview(state, canvas) {
  const size = SIZES[state.size];
  const scale = Math.min(880 / size.w, 560 / size.h, 1);
  const w = Math.round(size.w * scale);
  const h = Math.round(size.h * scale);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas.getContext('2d'), state, w, h);
  return { w, h, scale };
}

// Renders the cover at full export size on a fresh canvas.
export function renderExport(state, sizeKey) {
  const size = SIZES[sizeKey];
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas.getContext('2d'), state, size.w, size.h);
  return canvas;
}

function setPressed(group, value) {
  for (const button of document.querySelectorAll(`[data-group="${group}"]`)) {
    button.classList.toggle('on', button.dataset.value === value);
  }
}

function resetPanelTransform(panel) {
  panel.zoom = 1;
  panel.ox = 0;
  panel.oy = 0;
}

function buildPanelSlots(state, rerender) {
  const wrap = document.getElementById('panels');
  wrap.innerHTML = '';
  const count = LAYOUTS[state.layout].panels;
  for (let i = 0; i < count; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot' + (state.selected === i ? ' selected' : '');
    slot.innerHTML =
      `<span class="slot-label">Panel ${i + 1}</span>` +
      `<label class="slot-load">Load photo<input type="file" accept="image/*" data-panel="${i}"></label>` +
      `<label class="slot-zoom">Zoom <input type="range" min="1" max="2.6" step="0.05" value="${state.panels[i].zoom}" data-zoom="${i}"></label>`;
    slot.addEventListener('click', (event) => {
      if (event.target.tagName === 'INPUT') return;
      state.selected = i;
      buildPanelSlots(state, rerender);
      rerender();
    });
    wrap.appendChild(slot);
  }
  for (const input of wrap.querySelectorAll('input[type="file"]')) {
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      try {
        const img = await loadImage(url);
        const idx = Number(input.dataset.panel);
        state.panels[idx].img = img;
        resetPanelTransform(state.panels[idx]);
        state.selected = idx;
      } finally {
        URL.revokeObjectURL(url);
      }
      buildPanelSlots(state, rerender);
      rerender();
    });
  }
  for (const slider of wrap.querySelectorAll('input[type="range"]')) {
    slider.addEventListener('input', () => {
      state.panels[Number(slider.dataset.zoom)].zoom = Number(slider.value);
      rerender();
    });
  }
}

// Which panel sits under a pointer position on the preview canvas, or -1.
function panelAt(state, canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const px = ((clientX - rect.left) / rect.width) * canvas.width;
  const py = ((clientY - rect.top) / rect.height) * canvas.height;
  const rects = layoutPanels(state.layout, canvas.width, canvas.height);
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}

function wirePointer(state, canvas, rerender) {
  let dragging = null;
  canvas.addEventListener('pointerdown', (event) => {
    const idx = panelAt(state, canvas, event.clientX, event.clientY);
    if (idx < 0) return;
    state.selected = idx;
    buildPanelSlots(state, rerender);
    dragging = { idx, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    rerender();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const panel = state.panels[dragging.idx];
    const rect = canvas.getBoundingClientRect();
    const dx = (event.clientX - dragging.x) * (canvas.width / rect.width);
    const dy = (event.clientY - dragging.y) * (canvas.height / rect.height);
    const r = layoutPanels(state.layout, canvas.width, canvas.height)[dragging.idx];
    panel.ox = Math.max(-1, Math.min(1, panel.ox + (dx / Math.max(1, r.w)) * 2));
    panel.oy = Math.max(-1, Math.min(1, panel.oy + (dy / Math.max(1, r.h)) * 2));
    dragging.x = event.clientX;
    dragging.y = event.clientY;
    rerender();
  });
  const endDrag = () => {
    dragging = null;
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const idx = panelAt(state, canvas, event.clientX, event.clientY);
    if (idx < 0) return;
    const panel = state.panels[idx];
    panel.zoom = Math.max(1, Math.min(2.6, panel.zoom * (event.deltaY < 0 ? 1.08 : 0.93)));
    state.selected = idx;
    buildPanelSlots(state, rerender);
    rerender();
  }, { passive: false });
}

function wireButtons(state, rerender) {
  for (const button of document.querySelectorAll('[data-group="layout"]')) {
    button.addEventListener('click', () => {
      state.layout = button.dataset.value;
      state.selected = 0;
      setPressed('layout', state.layout);
      buildPanelSlots(state, rerender);
      rerender();
    });
  }
  for (const button of document.querySelectorAll('[data-group="grade"]')) {
    button.addEventListener('click', () => {
      state.grade = button.dataset.value;
      setPressed('grade', state.grade);
      rerender();
    });
  }
  for (const button of document.querySelectorAll('[data-group="size"]')) {
    button.addEventListener('click', () => {
      state.size = button.dataset.value;
      setPressed('size', state.size);
      rerender();
    });
  }
  for (const button of document.querySelectorAll('[data-sample]')) {
    button.addEventListener('click', async () => {
      const img = await loadImage(SAMPLES[button.dataset.sample].file);
      state.panels[state.selected].img = img;
      resetPanelTransform(state.panels[state.selected]);
      rerender();
    });
  }
  document.getElementById('fill-all').addEventListener('click', () => {
    const img = state.panels[state.selected].img;
    if (!img) return;
    const count = LAYOUTS[state.layout].panels;
    for (let i = 0; i < count; i++) {
      state.panels[i].img = img;
      resetPanelTransform(state.panels[i]);
    }
    rerender();
  });
  for (const button of document.querySelectorAll('[data-export]')) {
    button.addEventListener('click', () => {
      const key = button.dataset.export;
      const canvas = renderExport(state, key);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vice-nights-${key}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }, 'image/png');
    });
  }
}

function wireText(state, rerender) {
  const title = document.getElementById('title');
  const subtitle = document.getElementById('subtitle');
  const keywords = document.getElementById('keywords');
  title.addEventListener('input', () => {
    state.title = title.value;
    rerender();
  });
  subtitle.addEventListener('input', () => {
    state.subtitle = subtitle.value;
    rerender();
  });
  keywords.addEventListener('input', () => {
    state.keywords = keywords.value.split(',').map((s) => s.trim()).filter(Boolean);
    rerender();
  });
}

export async function startEditor() {
  const state = freshState();
  const canvas = document.getElementById('cover');
  const params = new URLSearchParams(location.search);
  if (params.get('shot') === 'cover') {
    await runCoverShot(state, canvas, params, loadSamples, loadImage);
    return;
  }
  await document.fonts.ready;
  if (params.get('shot') === 'editor') {
    applyShotParams(state, params);
    await loadShotPhotos(state, params, loadSamples, loadImage);
  } else {
    await loadSamples(state);
  }
  const rerender = () => renderPreview(state, canvas);
  buildPanelSlots(state, rerender);
  wirePointer(state, canvas, rerender);
  wireButtons(state, rerender);
  wireText(state, rerender);
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('keywords').value = state.keywords.join(', ');
  setPressed('layout', state.layout);
  setPressed('grade', state.grade);
  setPressed('size', state.size);
  rerender();
  if (params.get('shot') === 'editor') markReady();
}

startEditor();

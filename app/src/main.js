// Vice Nights Cover Press — editor boot and UI.
// Wires the controls to the painter in cover.js, loads photos (yours or
// the three procedural samples), and exports the PNG at full size.
// Shot mode (?shot=cover / ?shot=editor) renders a fixed scene for the
// dossier screenshots with no clicks needed.

import { drawViceCover, panelRects, VICE_LAYOUTS, VICE_GRADES, VICE_CAPTION_PRESETS, VICE_EXPORT_SIZES } from "./cover.js";
import { shotByName } from "./shots.js";

const SAMPLE_PHOTOS = [
  { id: "boulevard", src: "samples/boulevard.jpg", label: "Boulevard" },
  { id: "neon", src: "samples/neon.jpg", label: "Neon Street" },
  { id: "pier", src: "samples/pier.jpg", label: "Pier" },
];

const scene = {
  layout: "hero",
  grade: "sunset",
  title: "VICE NIGHTS",
  subtitle: "chase the sunset",
  chips: ["MIAMI HEAT", "EST. 2026"],
  captionSize: "m",
  shadow: true,
  size: "square",
  photos: [null, null, null, null],
  tunes: [
    { dx: 0, dy: 0, zoom: 1 },
    { dx: 0, dy: 0, zoom: 1 },
    { dx: 0, dy: 0, zoom: 1 },
    { dx: 0, dy: 0, zoom: 1 },
  ],
  singlePhoto: true,
  preset: "vice",
};

let selectedPanel = 0;
let canvas = null;
let ctx = null;
let dragging = null;

function $(id) {
  return document.getElementById(id);
}

function sizeById(id) {
  return VICE_EXPORT_SIZES.find((s) => s.id === id) || VICE_EXPORT_SIZES[0];
}

function currentPhotos() {
  if (scene.singlePhoto) {
    const first = scene.photos.find((p) => p) || null;
    return [first, first, first, first];
  }
  return scene.photos;
}

function paintPreview() {
  if (!canvas) return;
  const size = sizeById(scene.size);
  const scale = Math.min(920 / size.w, 560 / size.h);
  canvas.width = Math.round(size.w * scale);
  canvas.height = Math.round(size.h * scale);
  drawViceCover(ctx, { ...scene, photos: currentPhotos() }, canvas.width, canvas.height);
}

function paintFullFrame(target, w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  drawViceCover(c.getContext("2d"), { ...scene, photos: currentPhotos() }, w, h);
  target.replaceChildren(c);
  return c;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadSample(id, panelIndex) {
  const sample = SAMPLE_PHOTOS.find((s) => s.id === id);
  if (!sample) return;
  const img = await loadImage(sample.src);
  if (scene.singlePhoto) {
    scene.photos = [img, img, img, img];
  } else {
    scene.photos[panelIndex] = img;
  }
  paintPreview();
}

function applyPreset(id) {
  const preset = VICE_CAPTION_PRESETS.find((p) => p.id === id);
  if (!preset) return;
  scene.preset = id;
  scene.title = preset.title;
  scene.subtitle = preset.subtitle;
  scene.chips = [...preset.chips];
  $("titleInput").value = preset.title;
  $("subtitleInput").value = preset.subtitle;
  $("chipsInput").value = preset.chips.join(", ");
  document.querySelectorAll("[data-preset]").forEach((b) => b.classList.toggle("active", b.dataset.preset === id));
  paintPreview();
}

function readParams() {
  const q = new URLSearchParams(location.search);
  return q;
}

function applyShotParams(q) {
  const layout = q.get("layout");
  if (layout) scene.layout = layout;
  const grade = q.get("grade");
  if (grade) scene.grade = grade;
  const title = q.get("title");
  if (title) scene.title = title;
  const subtitle = q.get("subtitle");
  if (subtitle) scene.subtitle = subtitle;
  const size = q.get("size");
  if (size) scene.size = size;
}

// Export: draw at full export size on an offscreen canvas, download a PNG.
// Also stashes the data URL on window for automated checks.
async function exportPng(sizeId) {
  const size = sizeById(sizeId || scene.size);
  const off = document.createElement("canvas");
  off.width = size.w;
  off.height = size.h;
  await document.fonts.ready;
  drawViceCover(off.getContext("2d"), { ...scene, photos: currentPhotos() }, size.w, size.h);
  const url = off.toDataURL("image/png");
  window.__viceLastExport = url;
  const a = document.createElement("a");
  a.href = url;
  a.download = `vice-nights-${size.id}-${size.w}x${size.h}.png`;
  a.click();
  return url;
}

window.__viceExportPng = exportPng;

function panelAtPoint(ev) {
  const rect = canvas.getBoundingClientRect();
  const fx = (ev.clientX - rect.left) / rect.width;
  const fy = (ev.clientY - rect.top) / rect.height;
  const rects = panelRects(scene.layout, 1, 1);
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (fx >= r.x && fx <= r.x + r.w && fy >= r.y && fy <= r.y + r.h) return i;
  }
  return 0;
}

function buildControls() {
  const layoutRow = $("layoutRow");
  VICE_LAYOUTS.forEach((l) => {
    const b = document.createElement("button");
    b.className = "chip-btn";
    b.textContent = l.label;
    b.title = l.blurb;
    b.dataset.layout = l.id;
    b.addEventListener("click", () => {
      scene.layout = l.id;
      document.querySelectorAll("[data-layout]").forEach((x) => x.classList.toggle("active", x.dataset.layout === l.id));
      paintPreview();
    });
    layoutRow.appendChild(b);
  });
  const gradeRow = $("gradeRow");
  VICE_GRADES.forEach((g) => {
    const b = document.createElement("button");
    b.className = "grade-btn";
    b.dataset.grade = g.id;
    b.style.background = `linear-gradient(135deg, ${g.sky[0]}, ${g.sky[1]} 55%, ${g.sky[2]})`;
    b.innerHTML = `<span>${g.label}</span>`;
    b.addEventListener("click", () => {
      scene.grade = g.id;
      document.querySelectorAll("[data-grade]").forEach((x) => x.classList.toggle("active", x.dataset.grade === g.id));
      paintPreview();
    });
    gradeRow.appendChild(b);
  });
  const presetRow = $("presetRow");
  VICE_CAPTION_PRESETS.forEach((p) => {
    const b = document.createElement("button");
    b.className = "chip-btn";
    b.textContent = p.title;
    b.dataset.preset = p.id;
    b.addEventListener("click", () => applyPreset(p.id));
    presetRow.appendChild(b);
  });
  const sampleRow = $("sampleRow");
  SAMPLE_PHOTOS.forEach((s) => {
    const b = document.createElement("button");
    b.className = "chip-btn";
    b.textContent = s.label;
    b.addEventListener("click", () => loadSample(s.id, selectedPanel));
    sampleRow.appendChild(b);
  });
  const sizeRow = $("sizeRow");
  VICE_EXPORT_SIZES.forEach((s) => {
    const b = document.createElement("button");
    b.className = "chip-btn";
    b.textContent = s.label;
    b.dataset.size = s.id;
    b.addEventListener("click", () => {
      scene.size = s.id;
      document.querySelectorAll("[data-size]").forEach((x) => x.classList.toggle("active", x.dataset.size === s.id));
      paintPreview();
    });
    sizeRow.appendChild(b);
  });
}

function wireEditor() {
  $("titleInput").addEventListener("input", (ev) => {
    scene.title = ev.target.value.toUpperCase();
    scene.preset = null;
    document.querySelectorAll("[data-preset]").forEach((b) => b.classList.remove("active"));
    paintPreview();
  });
  $("subtitleInput").addEventListener("input", (ev) => {
    scene.subtitle = ev.target.value;
    scene.preset = null;
    document.querySelectorAll("[data-preset]").forEach((b) => b.classList.remove("active"));
    paintPreview();
  });
  $("chipsInput").addEventListener("input", (ev) => {
    scene.chips = ev.target.value.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, 3);
    paintPreview();
  });
  $("sizeSelect").addEventListener("change", (ev) => {
    scene.captionSize = ev.target.value;
    paintPreview();
  });
  $("shadowToggle").addEventListener("change", (ev) => {
    scene.shadow = ev.target.checked;
    paintPreview();
  });
  $("singleToggle").addEventListener("change", (ev) => {
    scene.singlePhoto = ev.target.checked;
    $("panelHint").textContent = scene.singlePhoto
      ? "One photo fills every panel. Untick to give each panel its own photo."
      : "Click a panel to select it, then load a photo into that panel.";
    paintPreview();
  });
  $("zoomSlider").addEventListener("input", (ev) => {
    scene.tunes[selectedPanel].zoom = Number(ev.target.value) / 100;
    paintPreview();
  });
  $("photoInput").addEventListener("change", async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    if (scene.singlePhoto) scene.photos = [img, img, img, img];
    else scene.photos[selectedPanel] = img;
    paintPreview();
  });
  $("exportBtn").addEventListener("click", () => exportPng(scene.size));
  canvas.addEventListener("pointerdown", (ev) => {
    selectedPanel = panelAtPoint(ev);
    dragging = { x: ev.clientX, y: ev.clientY, dx: scene.tunes[selectedPanel].dx, dy: scene.tunes[selectedPanel].dy };
    canvas.setPointerCapture(ev.pointerId);
    $("panelLabel").textContent = `Panel ${selectedPanel + 1} selected — drag to pan, scroll to zoom.`;
    $("zoomSlider").value = Math.round(scene.tunes[selectedPanel].zoom * 100);
  });
  canvas.addEventListener("pointermove", (ev) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const tune = scene.tunes[selectedPanel];
    tune.dx = dragging.dx + (ev.clientX - dragging.x) / rect.width;
    tune.dy = dragging.dy + (ev.clientY - dragging.y) / rect.height;
    paintPreview();
  });
  canvas.addEventListener("pointerup", () => { dragging = null; });
  canvas.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    selectedPanel = panelAtPoint(ev);
    const tune = scene.tunes[selectedPanel];
    tune.zoom = Math.min(3, Math.max(0.6, tune.zoom * (ev.deltaY < 0 ? 1.08 : 0.92)));
    $("zoomSlider").value = Math.round(tune.zoom * 100);
    paintPreview();
  }, { passive: false });
}

async function bootShotMode(q) {
  const shotName = q.get("shot") || "cover";
  const shot = shotByName(shotName);
  applyShotParams(q);
  scene.singlePhoto = false;
  await loadSample("boulevard", 0);
  await loadSample("neon", 1);
  await loadSample("pier", 2);
  await document.fonts.ready;
  if (shotName === "editor") {
    document.body.classList.add("shot-editor");
    buildControls();
    wireEditor();
    document.querySelectorAll("[data-layout]").forEach((x) => x.classList.toggle("active", x.dataset.layout === scene.layout));
    document.querySelectorAll("[data-grade]").forEach((x) => x.classList.toggle("active", x.dataset.grade === scene.grade));
    document.querySelectorAll("[data-size]").forEach((x) => x.classList.toggle("active", x.dataset.size === scene.size));
    document.querySelectorAll("[data-preset]").forEach((x) => x.classList.toggle("active", x.dataset.preset === scene.preset));
    paintPreview();
  } else {
    const holder = $("shotFrame");
    const size = sizeById(scene.size);
    holder.style.display = "block";
    $("app").style.display = "none";
    const c = paintFullFrame(holder, size.w, size.h);
    c.style.width = "100vw";
    c.style.height = "100vh";
    c.style.objectFit = "contain";
    c.style.background = "#0c0616";
  }
  document.body.dataset.ready = "true";
  window.__viceReady = true;
}

async function bootEditor() {
  canvas = $("coverCanvas");
  ctx = canvas.getContext("2d");
  buildControls();
  wireEditor();
  document.querySelectorAll("[data-layout]").forEach((x) => x.classList.toggle("active", x.dataset.layout === scene.layout));
  document.querySelectorAll("[data-grade]").forEach((x) => x.classList.toggle("active", x.dataset.grade === scene.grade));
  document.querySelectorAll("[data-size]").forEach((x) => x.classList.toggle("active", x.dataset.size === scene.size));
  document.querySelectorAll("[data-preset]").forEach((x) => x.classList.toggle("active", x.dataset.preset === scene.preset));
  await loadSample("boulevard", 0);
  await document.fonts.ready;
  paintPreview();
  document.body.dataset.ready = "true";
  window.__viceReady = true;
}

async function boot() {
  canvas = $("coverCanvas");
  ctx = canvas.getContext("2d");
  const q = readParams();
  if (q.has("shot")) {
    await bootShotMode(q);
  } else {
    await bootEditor();
  }
}

boot();

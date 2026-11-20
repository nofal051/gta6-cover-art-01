// Vice Nights Cover Press — cover painter.
// Draws a multi-panel GTA-style poster onto any 2D canvas, at any size.
// The same painter drives the live preview and the full-size PNG export,
// so what you see is exactly what you share. No network, no dates, no
// randomness in the output: the grain comes from a fixed-seed hash.

export const VICE_LAYOUTS = [
  { id: "hero", label: "Hero + Three", blurb: "One big hero panel, three stacked beside it." },
  { id: "grid", label: "2 x 2 Grid", blurb: "Four equal panels, classic poster grid." },
  { id: "bleed", label: "Full Bleed", blurb: "One photo edge to edge, caption on top." },
  { id: "strip", label: "Triple Strip", blurb: "Three tall vertical strips." },
  { id: "duo", label: "Duo Split", blurb: "Two tall halves, left and right." },
  { id: "diagonal", label: "Diagonal Split", blurb: "A slanted hero cut across the cover, two stacked panels on the right." },
];

export const VICE_GRADES = [
  { id: "sunset", label: "Sunset", sky: ["#ff7a3d", "#ff2e63", "#7b2ff7"], ink: "#fff6e8", accent: "#ffd166" },
  { id: "neon", label: "Neon Night", sky: ["#00e5ff", "#ff2ea6", "#2b0a4a"], ink: "#eafcff", accent: "#00e5ff" },
  { id: "golden", label: "Golden Hour", sky: ["#ffb703", "#fb8500", "#8d0801"], ink: "#fff8e7", accent: "#ffe066" },
  { id: "violet", label: "Dusk Violet", sky: ["#b5179e", "#7209b7", "#3a0ca3"], ink: "#f3e8ff", accent: "#e0aaff" },
  { id: "noir", label: "Palm Noir", sky: ["#1b1b2f", "#16213e", "#0f3460"], ink: "#f5f0e6", accent: "#e94560" },
  { id: "vicedusk", label: "Vice Dusk", sky: ["#ff6b9d", "#c9184a", "#3d348b"], ink: "#fff0f3", accent: "#ff8fa3" },
  { id: "candy", label: "Candy Floss", sky: ["#ff9ebb", "#a5f3fc", "#f472b6"], ink: "#fff7fb", accent: "#fde047" },
];

export const VICE_CAPTION_PRESETS = [
  { id: "vice", title: "VICE NIGHTS", subtitle: "chase the sunset", chips: ["MIAMI HEAT", "EST. 2026"] },
  { id: "coast", title: "NEON COAST", subtitle: "drive all night", chips: ["TOP DOWN", "PALM DRIVE"] },
  { id: "gold", title: "GOLDEN HOUR", subtitle: "last light, first gear", chips: ["BOULEVARD", "88 MPH"] },
  { id: "pier", title: "PIER PRESSURE", subtitle: "salt air & static", chips: ["BOARDWALK", "HIGH TIDE"] },
  { id: "midnight", title: "MIDNIGHT RUN", subtitle: "no maps, just lights", chips: ["AFTER DARK", "CITY LIMITS"] },
];

export const VICE_EXPORT_SIZES = [
  { id: "square", label: "Square 1080 x 1080", w: 1080, h: 1080 },
  { id: "portrait", label: "Portrait 1080 x 1350", w: 1080, h: 1350 },
  { id: "wide", label: "Wide 1920 x 1080", w: 1920, h: 1080 },
];

// A tiny deterministic hash: same (x, y, seed) always gives the same value.
function hashSpeckle(x, y, seed) {
  let n = (x * 374761393 + y * 668265263 + seed * 974634211) | 0;
  n = (n ^ (n >> 13)) | 0;
  n = Math.imul(n, 1274126177);
  n = (n ^ (n >> 16)) >>> 0;
  return n / 4294967295;
}

function gradeById(id) {
  return VICE_GRADES.find((g) => g.id === id) || VICE_GRADES[0];
}

function layoutById(id) {
  return VICE_LAYOUTS.find((l) => l.id === id) || VICE_LAYOUTS[0];
}

// Panel geometry, in fractions of the cover (0..1). A panel may carry a
// `cut` polygon (fractions of the panel itself) for slanted shapes.
export function panelRects(layoutId, w, h) {
  const band = 0.24; // caption band height, as a fraction of height
  const gap = 0.012; // gutters, as a fraction of width
  const artH = 1 - band;
  switch (layoutId) {
    case "grid":
      return [
        { x: 0, y: 0, w: 0.5 - gap / 2, h: artH / 2 - gap / 2 },
        { x: 0.5 + gap / 2, y: 0, w: 0.5 - gap / 2, h: artH / 2 - gap / 2 },
        { x: 0, y: artH / 2 + gap / 2, w: 0.5 - gap / 2, h: artH / 2 - gap / 2 },
        { x: 0.5 + gap / 2, y: artH / 2 + gap / 2, w: 0.5 - gap / 2, h: artH / 2 - gap / 2 },
      ];
    case "bleed":
      return [{ x: 0, y: 0, w: 1, h: 1 }];
    case "strip":
      return [0, 1, 2].map((i) => ({
        x: i * (1 / 3) + (i === 0 ? 0 : gap / 2),
        y: 0,
        w: 1 / 3 - (i === 1 ? gap : gap / 2),
        h: artH,
      }));
    case "duo":
      return [
        { x: 0, y: 0, w: 0.5 - gap / 2, h: artH },
        { x: 0.5 + gap / 2, y: 0, w: 0.5 - gap / 2, h: artH },
      ];
    case "diagonal":
      return [
        // Hero panel with a slanted right edge: wide at the top, narrow at the bottom.
        { x: 0, y: 0, w: 0.66, h: artH, cut: [[0, 0], [1, 0], [0.82, 1], [0, 1]] },
        { x: 0.66 + gap, y: 0, w: 0.34 - gap, h: artH / 2 - gap / 2 },
        { x: 0.66 + gap, y: artH / 2 + gap / 2, w: 0.34 - gap, h: artH / 2 - gap / 2 },
      ];
    case "hero":
    default:
      return [
        { x: 0, y: 0, w: 0.62, h: artH },
        { x: 0.62 + gap, y: 0, w: 0.38 - gap, h: artH / 3 - gap / 2 },
        { x: 0.62 + gap, y: artH / 3 + gap / 2, w: 0.38 - gap, h: artH / 3 - gap / 2 },
        { x: 0.62 + gap, y: (2 * artH) / 3 + gap / 2, w: 0.38 - gap, h: artH / 3 - gap / 2 },
      ];
  }
}

// Draw one photo into one panel, cover-fit, with the panel's pan and zoom.
export function paintPhotoInto(ctx, img, rect, px, py, w, h, tune) {
  const x = rect.x * w;
  const y = rect.y * h;
  const pw = rect.w * w;
  const ph = rect.h * h;
  ctx.save();
  ctx.beginPath();
  if (rect.cut) {
    ctx.moveTo(x + rect.cut[0][0] * pw, y + rect.cut[0][1] * ph);
    for (let i = 1; i < rect.cut.length; i++) {
      ctx.lineTo(x + rect.cut[i][0] * pw, y + rect.cut[i][1] * ph);
    }
    ctx.closePath();
  } else {
    ctx.rect(x, y, pw, ph);
  }
  ctx.clip();
  if (img) {
    const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
    const scale = base * (tune.zoom || 1);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = x + (pw - dw) / 2 + (tune.dx || 0) * pw;
    const dy = y + (ph - dh) / 2 + (tune.dy || 0) * ph;
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    const g = ctx.createLinearGradient(x, y, x + pw, y + ph);
    g.addColorStop(0, "#3a2b4f");
    g.addColorStop(1, "#120e1c");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, pw, ph);
  }
  ctx.restore();
}

// Grade wash: a sky gradient at low opacity, a warm tint, then vignette.
function paintGradeWash(ctx, grade, w, h, artH) {
  const g = ctx.createLinearGradient(0, 0, w, artH);
  g.addColorStop(0, grade.sky[0]);
  g.addColorStop(0.55, grade.sky[1]);
  g.addColorStop(1, grade.sky[2]);
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, artH);
  ctx.globalAlpha = 0.10;
  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = grade.sky[1];
  ctx.fillRect(0, 0, w, artH);
  ctx.restore();
  // Vignette: darkened corners so the caption pops.
  const v = ctx.createRadialGradient(w / 2, artH / 2, Math.min(w, artH) * 0.35, w / 2, artH / 2, Math.max(w, artH) * 0.75);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(10,4,20,0.42)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

// Deterministic film grain: speckles from the hash, never Math.random.
function paintGrain(ctx, w, h, seed) {
  const step = Math.max(3, Math.round(w / 360));
  ctx.save();
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const v = hashSpeckle(x, y, seed);
      if (v > 0.86) {
        ctx.fillStyle = v > 0.93 ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";
        ctx.fillRect(x, y, step, step);
      }
    }
  }
  ctx.restore();
}

// Panel gutters + a thin white frame and corner ticks, poster style.
function paintFrame(ctx, w, h, artH, accent) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = Math.max(2, w * 0.003);
  ctx.strokeRect(w * 0.014, h * 0.014, w * 0.972, h * 0.972);
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(3, w * 0.005);
  const t = w * 0.045;
  const m = w * 0.014;
  ctx.beginPath();
  ctx.moveTo(m, m + t); ctx.lineTo(m, m); ctx.lineTo(m + t, m);
  ctx.moveTo(w - m - t, m); ctx.lineTo(w - m, m); ctx.lineTo(w - m, m + t);
  ctx.moveTo(m, h - m - t); ctx.lineTo(m, h - m); ctx.lineTo(m + t, h - m);
  ctx.moveTo(w - m - t, h - m); ctx.lineTo(w - m, h - m); ctx.lineTo(w - m, h - m - t);
  ctx.stroke();
  ctx.restore();
}

function fitFont(ctx, text, fontFace, maxWidth, startPx) {
  let px = startPx;
  ctx.font = `${px}px ${fontFace}`;
  while (px > 12 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `${px}px ${fontFace}`;
  }
  return px;
}

// The caption block: big Anton title, Pacifico subtitle, pill chips.
function paintCaption(ctx, scene, grade, w, h, artH) {
  const bandY = artH;
  const bandH = h - artH;
  const pad = w * 0.045;
  // Caption band: deep plum with a sky-coloured top rule.
  const bg = ctx.createLinearGradient(0, bandY, 0, h);
  bg.addColorStop(0, "#160a24");
  bg.addColorStop(1, "#0c0616");
  ctx.fillStyle = bg;
  ctx.fillRect(0, bandY, w, bandH);
  ctx.fillStyle = grade.sky[0];
  ctx.fillRect(0, bandY, w, Math.max(3, h * 0.006));
  // Chips: small outlined pills on the right of the band. Measure them
  // first so the title never runs underneath them.
  const chips = scene.chips || [];
  let chipsWidth = 0;
  if (chips.length) {
    const chipH = Math.round(bandH * 0.26);
    const chipPx = Math.round(chipH * 0.52);
    ctx.save();
    ctx.font = `${chipPx}px Anton, sans-serif`;
    for (const label of chips) {
      chipsWidth += ctx.measureText(label).width + chipH * 1.1 + chipH * 0.5;
    }
    ctx.restore();
  }
  // Title with a sunset gradient fill.
  const sizeScale = { s: 0.82, m: 1, l: 1.22 }[scene.captionSize || "m"] || 1;
  const titleMax = chipsWidth > 0 ? w - pad * 2 - chipsWidth - pad : w - pad * 2;
  const titlePx = fitFont(ctx, scene.title || "VICE NIGHTS", "Anton, sans-serif", titleMax, Math.round(bandH * 0.52 * sizeScale));
  const grad = ctx.createLinearGradient(pad, bandY, w - pad, bandY + bandH);
  grad.addColorStop(0, grade.sky[0]);
  grad.addColorStop(0.5, grade.accent);
  grad.addColorStop(1, grade.sky[1]);
  ctx.save();
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  if (scene.shadow !== false) {
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = Math.round(w * 0.008);
    ctx.shadowOffsetY = Math.round(w * 0.004);
  }
  ctx.fillStyle = grad;
  ctx.font = `${titlePx}px Anton, sans-serif`;
  ctx.fillText(scene.title || "VICE NIGHTS", pad, bandY + bandH * 0.38);
  ctx.restore();
  // Subtitle in script lettering, tucked under the title.
  const subPx = Math.round(titlePx * 0.34);
  ctx.save();
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = grade.ink;
  ctx.font = `${subPx}px Pacifico, cursive`;
  ctx.fillText(scene.subtitle || "chase the sunset", pad, bandY + bandH * 0.78);
  ctx.restore();
  // Draw the chips on the right of the band.
  if (chips.length) {
    const chipH = Math.round(bandH * 0.26);
    const chipPx = Math.round(chipH * 0.52);
    ctx.save();
    ctx.font = `${chipPx}px Anton, sans-serif`;
    let cx = w - pad;
    for (let i = chips.length - 1; i >= 0; i--) {
      const label = chips[i];
      const tw = ctx.measureText(label).width;
      const cw = tw + chipH * 1.1;
      cx -= cw;
      ctx.strokeStyle = grade.accent;
      ctx.lineWidth = Math.max(1.5, w * 0.0016);
      ctx.beginPath();
      ctx.roundRect(cx, bandY + bandH * 0.14, cw, chipH, chipH / 2);
      ctx.stroke();
      ctx.fillStyle = grade.ink;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText(label, cx + chipH * 0.55, bandY + bandH * 0.14 + chipH / 2 + 1);
      cx -= chipH * 0.5;
    }
    ctx.restore();
  }
}

// Full-bleed caption: scrim at the bottom, title over the photo.
function paintBleedCaption(ctx, scene, grade, w, h) {
  const scrim = ctx.createLinearGradient(0, h * 0.55, 0, h);
  scrim.addColorStop(0, "rgba(10,4,20,0)");
  scrim.addColorStop(1, "rgba(10,4,20,0.82)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, h * 0.55, w, h * 0.45);
  const pad = w * 0.045;
  const sizeScale = { s: 0.82, m: 1, l: 1.22 }[scene.captionSize || "m"] || 1;
  const titlePx = fitFont(ctx, scene.title || "VICE NIGHTS", "Anton, sans-serif", w - pad * 2, Math.round(h * 0.11 * sizeScale));
  const grad = ctx.createLinearGradient(pad, h * 0.8, w - pad, h * 0.8);
  grad.addColorStop(0, grade.sky[0]);
  grad.addColorStop(0.5, grade.accent);
  grad.addColorStop(1, grade.sky[1]);
  ctx.save();
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  if (scene.shadow !== false) {
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = Math.round(w * 0.01);
    ctx.shadowOffsetY = Math.round(w * 0.005);
  }
  ctx.fillStyle = grad;
  ctx.font = `${titlePx}px Anton, sans-serif`;
  ctx.fillText(scene.title || "VICE NIGHTS", pad, h * 0.88);
  ctx.fillStyle = grade.ink;
  ctx.font = `${Math.round(titlePx * 0.32)}px Pacifico, cursive`;
  ctx.fillText(scene.subtitle || "chase the sunset", pad, h * 0.95);
  ctx.restore();
}

// Main entry: paint the whole cover. `scene.photos` is an array of images
// (or nulls); `scene.tunes` is an array of {dx, dy, zoom} per panel.
export function drawViceCover(ctx, scene, w, h) {
  const grade = gradeById(scene.grade);
  const layoutId = scene.layout || "hero";
  const rects = panelRects(layoutId, w, h);
  const artH = layoutId === "bleed" ? h : h * 0.76;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#0c0616";
  ctx.fillRect(0, 0, w, h);
  const photos = (scene.photos || []).filter(Boolean);
  const tunes = scene.tunes || [];
  rects.forEach((rect, i) => {
    const img = photos.length ? photos[i % photos.length] : null;
    paintPhotoInto(ctx, img, rect, 0, 0, w, h, tunes[i] || { dx: 0, dy: 0, zoom: 1 });
  });
  paintGradeWash(ctx, grade, w, h, artH);
  paintGrain(ctx, w, h, 7);
  if (layoutId === "bleed") {
    paintBleedCaption(ctx, scene, grade, w, h);
  } else {
    paintCaption(ctx, scene, grade, w, h, artH);
  }
  paintFrame(ctx, w, h, artH, grade.accent);
}

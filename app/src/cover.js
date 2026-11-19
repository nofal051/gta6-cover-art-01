// Vice Nights Cover Press — the cover painter.
//
// One pure function, drawCover, turns a plain state object into a
// GTA-poster-style cover on any 2D canvas: panelled photos, a colour
// grade, film grain, a vignette, and layered caption lettering. It keeps
// no state of its own, so the live editor, the PNG export and the
// deterministic screenshot scenes all paint through this same code.

export const SIZES = {
  square: { w: 1080, h: 1080, label: 'Square 1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080 x 1350' },
  wide: { w: 1920, h: 1080, label: 'Wide 1920 x 1080' },
};

export const LAYOUTS = {
  'hero-three': { label: 'Hero + Three', panels: 4 },
  'grid-four': { label: 'Four Grid', panels: 4 },
  'full-bleed': { label: 'Full Bleed', panels: 1 },
  'triple-strip': { label: 'Triple Strip', panels: 3 },
};

export const GRADES = {
  sunset: { label: 'Vice Sunset', neon: '#ff5da2' },
  neon: { label: 'Neon Night', neon: '#2ef2ff' },
  golden: { label: 'Golden Hour', neon: '#ffb02e' },
  dusk: { label: 'Dusk Violet', neon: '#c084fc' },
  noir: { label: 'Palm Noir', neon: '#f5f5f5' },
};

// mulberry32: a small seeded generator so the grain speckles land in the
// same places on every render of the same cover.
export function seededRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gutterFor(width) {
  return Math.max(6, Math.round(width * 0.008));
}

// Panel rectangles for a layout, in cover pixels. Panels sit on a white
// frame: the gaps between them are the poster's gutters.
export function layoutPanels(layout, W, H) {
  const g = gutterFor(W);
  if (layout === 'hero-three') {
    const heroW = Math.round(W * 0.62);
    const sideX = heroW + g;
    const sideW = W - sideX;
    const cellH = Math.round((H - 2 * g) / 3);
    return [
      { x: 0, y: 0, w: heroW, h: H },
      { x: sideX, y: 0, w: sideW, h: cellH },
      { x: sideX, y: cellH + g, w: sideW, h: cellH },
      { x: sideX, y: 2 * (cellH + g), w: sideW, h: H - 2 * (cellH + g) },
    ];
  }
  if (layout === 'grid-four') {
    const halfW = Math.round((W - g) / 2);
    const halfH = Math.round((H - g) / 2);
    return [
      { x: 0, y: 0, w: halfW, h: halfH },
      { x: halfW + g, y: 0, w: W - halfW - g, h: halfH },
      { x: 0, y: halfH + g, w: halfW, h: H - halfH - g },
      { x: halfW + g, y: halfH + g, w: W - halfW - g, h: H - halfH - g },
    ];
  }
  if (layout === 'triple-strip') {
    const cellW = Math.round((W - 2 * g) / 3);
    return [
      { x: 0, y: 0, w: cellW, h: H },
      { x: cellW + g, y: 0, w: cellW, h: H },
      { x: 2 * (cellW + g), y: 0, w: W - 2 * (cellW + g), h: H },
    ];
  }
  return [{ x: 0, y: 0, w: W, h: H }]; // full-bleed: one panel, edge to edge
}

// Paints one photo (or an empty-panel placeholder) inside a rectangle,
// cover-fitting it and honouring the panel's pan (ox, oy in -1..1) and zoom.
function paintPhoto(ctx, img, rect, panel) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (!img) {
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, '#2a1745');
    grad.addColorStop(1, '#12081f');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = Math.max(2, w * 0.01);
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w, y);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = `700 ${Math.round(w * 0.055)}px Anton, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD PHOTO', x + w / 2, y + h / 2);
    ctx.restore();
    return;
  }
  const zoom = panel.zoom || 1;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const ox = panel.ox || 0;
  const oy = panel.oy || 0;
  const dx = x + (w - dw) / 2 + ox * Math.max(0, (dw - w) / 2);
  const dy = y + (h - dh) / 2 + oy * Math.max(0, (dh - h) / 2);
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// Each grade is a recipe: vertical colour washes (with a blend mode) plus
// a few radial glows. Noir is not a wash at all — it desaturates the
// photos themselves at paint time (see drawCover).
const GRADE_RECIPES = {
  sunset: {
    washes: [
      [[0, 'rgba(255,45,120,0.12)'], [0.6, 'rgba(255,110,40,0.10)'], [1, 'rgba(255,140,0,0.30)']],
      'overlay',
    ],
    glows: [[0.5, 0.95, 0.7, 'rgba(255,120,40,0.22)', 'screen']],
  },
  neon: {
    washes: [
      [[0, 'rgba(255,45,149,0.20)'], [0.55, 'rgba(20,10,60,0.05)'], [1, 'rgba(0,240,255,0.20)']],
      'soft-light',
    ],
    glows: [
      [0.85, 0.12, 0.45, 'rgba(255,45,149,0.20)', 'screen'],
      [0.1, 0.9, 0.4, 'rgba(0,240,255,0.16)', 'screen'],
    ],
  },
  golden: {
    washes: [
      [[0, 'rgba(255,190,80,0.14)'], [1, 'rgba(255,140,20,0.22)']],
      'soft-light',
    ],
    glows: [[0.5, 0.35, 0.6, 'rgba(255,210,120,0.18)', 'screen']],
  },
  dusk: {
    washes: [
      [[0, 'rgba(120,60,220,0.22)'], [0.6, 'rgba(60,20,120,0.10)'], [1, 'rgba(20,8,50,0.28)']],
      'overlay',
    ],
    glows: [[0.5, 0.2, 0.55, 'rgba(150,90,255,0.16)', 'screen']],
  },
  noir: { washes: null, glows: [] },
};

function paintGrade(ctx, grade, W, H) {
  const recipe = GRADE_RECIPES[grade] || GRADE_RECIPES.sunset;
  if (recipe.washes) {
    const [stops, mode] = recipe.washes;
    const wash = ctx.createLinearGradient(0, 0, 0, H);
    for (const [pos, color] of stops) wash.addColorStop(pos, color);
    ctx.save();
    ctx.globalCompositeOperation = mode;
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  for (const [fx, fy, fr, color, mode] of recipe.glows) {
    const glow = ctx.createRadialGradient(W * fx, H * fy, 0, W * fx, H * fy, W * fr);
    glow.addColorStop(0, color);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalCompositeOperation = mode;
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  // Vignette on every grade: dark corners, lifted centre.
  const vig = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.32,
    W / 2, H / 2, Math.max(W, H) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(8,2,20,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

function paintGrain(ctx, W, H) {
  const rnd = seededRandom(20261119);
  ctx.save();
  for (let i = 0; i < 2600; i++) {
    const v = rnd() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},${0.03 + rnd() * 0.05})`;
    ctx.fillRect(rnd() * W, rnd() * H, 1.6, 1.6);
  }
  ctx.restore();
}

// Shrinks a font until the text fits, never below 12px. Returns the size used.
function fitFont(ctx, text, maxWidth, startPx, family, weight) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > 12 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return px;
}

export function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function starBurstPath(ctx, cx, cy, outer, inner, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// The caption block: big layered Anton title, neon Pacifico subtitle
// above it, keyword chips along the bottom, and a star-burst badge.
function paintCaption(ctx, state, W, H) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  const title = (state.title || 'SUNSET HEIST').toUpperCase();
  const subtitle = state.subtitle || '';
  const pad = Math.round(W * 0.045);
  const maxW = W - pad * 2;

  if (state.layout === 'full-bleed') {
    // A dusk band so the lettering sits on any photo.
    const bandY = H - Math.round(H * 0.30);
    const grad = ctx.createLinearGradient(0, bandY - 40, 0, H);
    grad.addColorStop(0, 'rgba(10,4,24,0)');
    grad.addColorStop(0.35, 'rgba(10,4,24,0.62)');
    grad.addColorStop(1, 'rgba(10,4,24,0.82)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, bandY - 40, W, H - bandY + 40);
  }

  const titlePx = fitFont(ctx, title, maxW, Math.round(W * 0.105), 'Anton, sans-serif', 400);
  const titleY = H - Math.round(H * 0.075);
  ctx.save();
  ctx.translate(pad, titleY);
  ctx.rotate(-0.022);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `400 ${titlePx}px Anton, sans-serif`;
  // Layered lettering: dark offset, dark outline, white face.
  ctx.fillStyle = '#160a2e';
  ctx.fillText(title, 7, 7);
  ctx.lineWidth = Math.max(3, titlePx * 0.13);
  ctx.strokeStyle = '#160a2e';
  ctx.lineJoin = 'round';
  ctx.strokeText(title, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, 0, 0);
  ctx.restore();

  if (subtitle) {
    const subPx = Math.max(18, Math.round(titlePx * 0.34));
    ctx.save();
    ctx.translate(pad + Math.round(W * 0.01), titleY - titlePx - Math.round(H * 0.012));
    ctx.rotate(-0.022);
    ctx.font = `400 ${subPx}px Pacifico, cursive`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = grade.neon;
    ctx.shadowBlur = Math.round(W * 0.018);
    ctx.fillStyle = grade.neon;
    ctx.fillText(subtitle, 0, 0);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(subtitle, 0, 0);
    ctx.restore();
  }

  const words = (state.keywords || []).filter(Boolean).slice(0, 5);
  if (words.length) {
    const chipPx = Math.max(13, Math.round(W * 0.02));
    ctx.font = `400 ${chipPx}px Anton, sans-serif`;
    const ch = chipPx * 1.7;
    const cy = H - Math.round(H * 0.035) - ch / 2;
    let cx = pad;
    ctx.textBaseline = 'middle';
    for (const word of words) {
      const label = word.toUpperCase();
      const cw = ctx.measureText(label).width + chipPx * 1.1;
      ctx.save();
      ctx.fillStyle = 'rgba(10,4,24,0.66)';
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = Math.max(1.5, W * 0.0016);
      roundRectPath(ctx, cx, cy - ch / 2, cw, ch, ch / 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(label, cx + cw / 2, cy + 1);
      ctx.restore();
      cx += cw + Math.round(W * 0.012);
    }
  }

  // Corner badge: a pink star burst with the press name.
  const badgeR = Math.round(W * 0.052);
  ctx.save();
  ctx.translate(W - pad - badgeR, pad + badgeR);
  ctx.rotate(-0.14);
  starBurstPath(ctx, 0, 0, badgeR, badgeR * 0.82, 12);
  ctx.fillStyle = '#ff2d95';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = `400 ${Math.round(badgeR * 0.34)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VICE', 0, -Math.round(badgeR * 0.16));
  ctx.fillText('NIGHTS', 0, Math.round(badgeR * 0.22));
  ctx.restore();
}

// Paints the whole cover onto ctx's canvas at the size the canvas already
// has. state: { layout, grade, title, subtitle, keywords, panels } where
// panels[i] is { img, zoom, ox, oy } and img may be null.
export function drawCover(ctx, state, W, H) {
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  const rects = layoutPanels(state.layout, W, H);
  const noir = state.grade === 'noir';
  rects.forEach((rect, i) => {
    if (noir) ctx.filter = 'grayscale(0.85) contrast(1.18) brightness(1.04)';
    paintPhoto(ctx, state.panels[i] ? state.panels[i].img : null, rect, state.panels[i] || {});
    ctx.filter = 'none';
  });
  paintGrade(ctx, state.grade, W, H);
  paintGrain(ctx, W, H);
  paintCaption(ctx, state, W, H);
  // Thin outer frame.
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(3, gutterFor(W) * 0.7);
  ctx.strokeRect(0, 0, W, H);
  ctx.restore();
}

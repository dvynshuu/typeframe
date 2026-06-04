import type { Theme, ThemeDecoration } from '../types';

export function drawThemeDecorations(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme
): void {
  const list = theme.decorations ?? [];
  for (const d of list) {
    switch (d) {
      case 'vignette':
        drawVignette(ctx, w, h);
        break;
      case 'grain':
        drawGrain(ctx, w, h, 0.04);
        break;
      case 'scanlines':
        drawScanlines(ctx, w, h, theme.accent);
        break;
      case 'grid':
        drawGrid(ctx, w, h, theme.accent);
        break;
      case 'frame':
        drawFrame(ctx, w, h, theme.accent);
        break;
      case 'masthead':
        drawMasthead(ctx, w, h, theme.accent);
        break;
      case 'glow-orb':
        drawGlowOrb(ctx, w, h, theme.accent);
        break;
      case 'column-rule':
        drawColumnRule(ctx, w, h, theme.accent);
        break;
      case 'accent-rule':
        drawAccentRule(ctx, w, h, theme.accent);
        break;
      case 'bezel':
        drawBezel(ctx, w, h, theme.accent);
        break;
      case 'economist-header':
        drawEconomistHeader(ctx, w, h, theme.accent);
        break;
      case 'vertical-grid':
        drawVerticalGrid(ctx, w, h, theme.accent);
        break;
      case 'double-frame':
        drawDoubleFrame(ctx, w, h, theme.accent);
        break;
      case 'braun-grid':
        drawBraunGrid(ctx, w, h);
        break;
      case 'braun-dials':
        drawBraunDials(ctx, w, h, theme.accent);
        break;
      case 'bauhaus-shapes':
        drawBauhausShapes(ctx, w, h, theme.accent);
        break;
    }
  }
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, Math.max(w, h) * 0.72);
  g.addColorStop(0, 'transparent');
  g.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

const grainPatternCache = new Map<number, CanvasPattern>();

function getGrainPattern(ctx: CanvasRenderingContext2D, intensity: number): CanvasPattern | null {
  if (grainPatternCache.has(intensity)) {
    return grainPatternCache.get(intensity)!;
  }

  const size = 256;
  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(size, size)
    : document.createElement('canvas');
  if (canvas instanceof HTMLCanvasElement) {
    canvas.width = size;
    canvas.height = size;
  }

  const gCtx = canvas.getContext('2d');
  if (!gCtx) return null;

  const id = gCtx.createImageData(size, size);
  const d = id.data;
  const step = 4;

  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const idx = (y * size + x) * 4;
      const v = Math.random() * 40;
      d[idx] = 255;
      d[idx + 1] = 255;
      d[idx + 2] = 255;
      d[idx + 3] = Math.floor(v);
    }
  }

  gCtx.putImageData(id, 0, 0);
  const pattern = ctx.createPattern(canvas as any, 'repeat');
  if (pattern) {
    grainPatternCache.set(intensity, pattern);
  }
  return pattern;
}

function drawGrain(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number): void {
  const pattern = getGrainPattern(ctx, intensity);
  if (!pattern) return;
  ctx.save();
  ctx.globalAlpha = intensity;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawScanlines(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string): void {
  ctx.save();
  ctx.globalAlpha = 0.12;
  for (let y = 0; y < h; y += 3) {
    ctx.fillStyle = y % 6 === 0 ? accent : 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, y, w, 1);
  }
  ctx.restore();
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string): void {
  const gap = Math.max(32, Math.round(w / 24));
  ctx.save();
  ctx.strokeStyle = accent + '18';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gap) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFrame(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string): void {
  const m = Math.min(w, h) * 0.06;
  ctx.save();
  ctx.strokeStyle = accent + '55';
  ctx.lineWidth = 2;
  ctx.strokeRect(m, m, w - m * 2, h - m * 2);
  ctx.restore();
}

function drawMasthead(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string): void {
  ctx.save();
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, w, h * 0.028);
  ctx.fillStyle = accent + '99';
  ctx.font = `600 ${Math.round(h * 0.018)}px "IBM Plex Sans", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('TYPEFRAME', w * 0.08, h * 0.052);
  ctx.restore();
}

function drawGlowOrb(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string): void {
  const g = ctx.createRadialGradient(w * 0.85, h * 0.15, 0, w * 0.85, h * 0.15, w * 0.45);
  g.addColorStop(0, accent + '44');
  g.addColorStop(0.5, accent + '12');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawColumnRule(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string): void {
  ctx.save();
  ctx.fillStyle = accent + 'cc';
  ctx.fillRect(w * 0.08, h * 0.12, 3, h * 0.76);
  ctx.restore();
}

function drawAccentRule(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string): void {
  const g = ctx.createLinearGradient(0, h * 0.08, w, h * 0.08);
  g.addColorStop(0, 'transparent');
  g.addColorStop(0.2, accent);
  g.addColorStop(0.8, accent);
  g.addColorStop(1, 'transparent');
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, h * 0.08, w, 2);
  const g2 = ctx.createRadialGradient(w / 2, h * 0.92, 0, w / 2, h * 0.92, w * 0.35);
  g2.addColorStop(0, accent + '33');
  g2.addColorStop(1, 'transparent');
  ctx.fillStyle = g2;
  ctx.fillRect(0, h * 0.5, w, h * 0.5);
  ctx.restore();
}

function drawBezel(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string): void {
  const m = w * 0.05;
  ctx.save();
  ctx.strokeStyle = accent + '33';
  ctx.lineWidth = 3;
  roundRect(ctx, m, m, w - m * 2, h - m * 2, 16);
  ctx.stroke();
  ctx.fillStyle = accent + '08';
  roundRect(ctx, m + 8, m + 8, w - m * 2 - 16, h - m * 2 - 16, 10);
  ctx.fill();
  ctx.restore();
}

/* ─── Curated Brand Decorations ─── */

function drawEconomistHeader(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string): void {
  ctx.save();
  
  // Strict line indicator at the top
  ctx.fillStyle = accent;
  ctx.fillRect(w * 0.08, h * 0.13, w * 0.84, 4);

  // Brand flag badge
  const rectW = Math.max(130, w * 0.22);
  const rectH = Math.max(26, h * 0.038);
  ctx.fillRect(w * 0.08, h * 0.07, rectW, rectH);

  // White text inside Economist red flag
  ctx.fillStyle = '#ffffff';
  ctx.font = `italic 700 ${rectH * 0.52}px "Playfair Display", Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('The Economist', w * 0.08 + rectW / 2, h * 0.07 + rectH / 2);

  ctx.restore();
}

function drawVerticalGrid(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string): void {
  ctx.save();
  // Faint red washi columns representing traditional vertical rhythm
  ctx.strokeStyle = accent + '0b';
  ctx.lineWidth = 1;
  const gap = Math.max(32, w * 0.045);
  for (let x = w * 0.08; x < w * 0.92; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, h * 0.08);
    ctx.lineTo(x, h * 0.92);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDoubleFrame(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string): void {
  ctx.save();
  
  // Geometric AD frames
  const m1 = Math.min(w, h) * 0.05;
  ctx.strokeStyle = accent + 'bb';
  ctx.lineWidth = 3;
  ctx.strokeRect(m1, m1, w - m1 * 2, h - m1 * 2);

  const m2 = m1 + 8;
  ctx.strokeStyle = accent + '44';
  ctx.lineWidth = 1;
  ctx.strokeRect(m2, m2, w - m2 * 2, h - m2 * 2);

  ctx.restore();
}

function drawBraunGrid(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  // Fine dot alignment grid
  ctx.fillStyle = 'rgba(26, 26, 26, 0.06)';
  const dotGap = Math.max(32, w * 0.05);
  for (let x = w * 0.08; x < w * 0.92; x += dotGap) {
    for (let y = h * 0.08; y < h * 0.92; y += dotGap) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawBraunDials(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string): void {
  ctx.save();
  
  // Technical division line
  ctx.strokeStyle = 'rgba(26, 26, 26, 0.08)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.89);
  ctx.lineTo(w * 0.92, h * 0.89);
  ctx.stroke();

  // Draw functional circular dials in bottom right corner
  const dialRadius = Math.max(7, h * 0.012);
  const rightX = w * 0.92 - dialRadius;
  const rightY = h * 0.935;

  // Dial 1: Braun signature orange dial
  ctx.fillStyle = accent; // '#eb5e28'
  ctx.beginPath();
  ctx.arc(rightX, rightY, dialRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Dial 1 indicator pointer
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rightX, rightY);
  ctx.lineTo(rightX, rightY - dialRadius + 2.5);
  ctx.stroke();

  // Dial 2: Minimalist green dial
  ctx.fillStyle = '#4e6e58';
  ctx.beginPath();
  ctx.arc(rightX - dialRadius * 2.6, rightY, dialRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Dial 2 pointer (rotated)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rightX - dialRadius * 2.6, rightY);
  ctx.lineTo(rightX - dialRadius * 2.6 - dialRadius * 0.6, rightY - dialRadius * 0.6);
  ctx.stroke();

  ctx.restore();
}

function drawBauhausShapes(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string): void {
  ctx.save();
  
  // Dynamic top-right primary red-yellow glow circle
  ctx.fillStyle = 'rgba(214, 40, 40, 0.06)';
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.18, Math.min(w, h) * 0.18, 0, Math.PI * 2);
  ctx.fill();

  // Asymmetrical primary blue card block
  ctx.fillStyle = 'rgba(0, 48, 73, 0.05)';
  ctx.fillRect(w * 0.08, h * 0.66, w * 0.26, h * 0.18);

  // Thick geometric dividing rule
  ctx.strokeStyle = 'rgba(27, 27, 27, 0.14)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.88);
  ctx.lineTo(w * 0.92, h * 0.88);
  ctx.stroke();

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

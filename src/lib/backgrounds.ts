import type { BackgroundConfig } from '../types';

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bg: BackgroundConfig
): void {
  ctx.save();
  switch (bg.type) {
    case 'solid':
      ctx.fillStyle = bg.solidColor ?? '#0f0f12';
      ctx.fillRect(0, 0, width, height);
      break;
    case 'gradient':
      drawLinearGradient(ctx, width, height, bg);
      break;
    case 'mesh':
      drawMeshGradient(ctx, width, height, bg);
      if (bg.glassBlur) drawGlassOverlay(ctx, width, height, bg.glassBlur);
      break;
    case 'glass':
      drawMeshGradient(ctx, width, height, {
        ...bg,
        meshColors: bg.meshColors ?? ['#1e293b', '#0f172a', '#334155', '#1e3a5f'],
      });
      drawGlassOverlay(ctx, width, height, bg.glassBlur ?? 20);
      break;
    case 'noise':
      drawLinearGradient(ctx, width, height, bg);
      drawNoise(ctx, width, height, bg.noiseIntensity ?? 0.06);
      break;
    case 'image':
      // Image drawn async in renderer when loaded
      ctx.fillStyle = bg.solidColor ?? '#18181b';
      ctx.fillRect(0, 0, width, height);
      break;
    default:
      ctx.fillStyle = '#0f0f12';
      ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
}

function drawLinearGradient(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bg: BackgroundConfig
): void {
  const angle = ((bg.gradientAngle ?? 135) * Math.PI) / 180;
  const cx = w / 2;
  const cy = h / 2;
  const len = Math.sqrt(w * w + h * h) / 2;
  const x0 = cx - Math.cos(angle) * len;
  const y0 = cy - Math.sin(angle) * len;
  const x1 = cx + Math.cos(angle) * len;
  const y1 = cy + Math.sin(angle) * len;
  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  const stops = bg.gradientStops ?? [
    { color: '#0f0f12', position: 0 },
    { color: '#1a1a22', position: 1 },
  ];
  stops.forEach((s) => grad.addColorStop(s.position, s.color));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawMeshGradient(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bg: BackgroundConfig
): void {
  const colors = bg.meshColors ?? ['#0f172a', '#1e293b', '#312e81', '#0e7490'];
  const blobs = [
    { x: 0.2, y: 0.3, r: 0.55, c: colors[0] },
    { x: 0.8, y: 0.2, r: 0.5, c: colors[1] ?? colors[0] },
    { x: 0.5, y: 0.85, r: 0.6, c: colors[2] ?? colors[0] },
    { x: 0.1, y: 0.75, r: 0.45, c: colors[3] ?? colors[0] },
  ];
  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, w, h);
  blobs.forEach((b) => {
    const g = ctx.createRadialGradient(
      b.x * w,
      b.y * h,
      0,
      b.x * w,
      b.y * h,
      b.r * Math.max(w, h)
    );
    g.addColorStop(0, b.c + 'cc');
    g.addColorStop(0.6, b.c + '44');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

function drawGlassOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  _blur: number
): void {
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, 0, w, h);
  const margin = w * 0.06;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  roundRect(ctx, margin, margin, w - margin * 2, h - margin * 2, 24);
  ctx.stroke();
}

const noisePatternCache = new Map<number, CanvasPattern>();

export function getNoisePattern(ctx: CanvasRenderingContext2D, intensity: number): CanvasPattern | null {
  if (noisePatternCache.has(intensity)) {
    return noisePatternCache.get(intensity)!;
  }

  const size = 256;
  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(size, size)
    : document.createElement('canvas');
  if (canvas instanceof HTMLCanvasElement) {
    canvas.width = size;
    canvas.height = size;
  }

  const nCtx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
  if (!nCtx) return null;

  const id = nCtx.createImageData(size, size);
  const d = id.data;

  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * intensity;
    if (n >= 0) {
      d[i] = 255;
      d[i + 1] = 255;
      d[i + 2] = 255;
      d[i + 3] = Math.floor(n * 255);
    } else {
      d[i] = 0;
      d[i + 1] = 0;
      d[i + 2] = 0;
      d[i + 3] = Math.floor(-n * 255);
    }
  }

  nCtx.putImageData(id, 0, 0);
  const pattern = ctx.createPattern(canvas as any, 'repeat');
  if (pattern) {
    noisePatternCache.set(intensity, pattern);
  }
  return pattern;
}

export function drawNoise(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  intensity: number
): void {
  const pattern = getNoisePattern(ctx, intensity);
  if (!pattern) return;
  ctx.save();
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
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
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export const imageCache = new Map<string, HTMLImageElement>();

export async function drawBackgroundImage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  url: string,
  opacity = 1,
  sizeMode: 'cover' | 'contain' | 'stretch' | 'original' = 'cover',
  imageScale = 1
): Promise<void> {
  const draw = (img: HTMLImageElement) => {
    ctx.save();
    ctx.globalAlpha = opacity;
    let sw = img.width;
    let sh = img.height;
    let scale = 1;

    if (sizeMode === 'cover') {
      scale = Math.max(width / img.width, height / img.height);
    } else if (sizeMode === 'contain') {
      scale = Math.min(width / img.width, height / img.height);
    } else if (sizeMode === 'stretch') {
      sw = width;
      sh = height;
      scale = 1;
    } else if (sizeMode === 'original') {
      scale = 1;
    }

    if (sizeMode !== 'stretch') {
      scale *= imageScale;
      sw = img.width * scale;
      sh = img.height * scale;
    }

    ctx.drawImage(img, (width - sw) / 2, (height - sh) / 2, sw, sh);
    ctx.restore();
  };

  if (imageCache.has(url)) {
    draw(imageCache.get(url)!);
    return;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(url, img);
      draw(img);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = url;
  });
}


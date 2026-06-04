import type { EditorState, RenderOptions, Theme } from '../types';
import { drawBackground, drawBackgroundImage, drawNoise } from './backgrounds';
import { drawThemeDecorations } from './theme-decorations';
import { getTheme } from './themes';
import { parseText } from '../utils/text-parser';

export async function renderToCanvas(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  state: EditorState,
  options: RenderOptions = {}
): Promise<void> {
  const scale = options.scale ?? 1;
  const w = state.width;
  const h = state.height;
  const displayW = Math.round(w * scale);
  const displayH = Math.round(h * scale);

  if (canvas instanceof HTMLCanvasElement) {
    canvas.width = displayW;
    canvas.height = displayH;
  } else {
    // OffscreenCanvas dimensions set via constructor or reassignment
    if ('width' in canvas) {
      (canvas as OffscreenCanvas).width = displayW;
      (canvas as OffscreenCanvas).height = displayH;
    }
  }

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
  if (!ctx) return;

  ctx.scale(scale, scale);
  const theme = getTheme(state.themeId);
  const bg = state.background;

  drawBackground(ctx, w, h, bg);

  if (bg.type === 'image' && bg.imageUrl) {
    await drawBackgroundImage(
      ctx,
      w,
      h,
      bg.imageUrl,
      bg.imageOpacity ?? 0.85,
      bg.imageSizeMode ?? 'cover',
      bg.imageScale ?? 1
    );
  }

  if (bg.type === 'mesh' && bg.noiseIntensity) {
    drawNoise(ctx, w, h, bg.noiseIntensity);
  }

  drawThemeDecorations(ctx, w, h, theme);

  for (const block of state.blocks) {
    if (block.isCode) {
      drawCodeBlock(ctx, block, state, theme);
    } else {
      drawTextBlock(ctx, block, state, theme);
    }
  }

  drawAccentBar(ctx, state, theme);
}

function drawTextBlock(
  ctx: CanvasRenderingContext2D,
  block: EditorState['blocks'][0],
  state: EditorState,
  theme: Theme
): void {
  const { typography, textMode } = state;
  const lines = parseText(block.content, textMode);
  const align = typography.textAlign;
  const fontSize = typography.fontSize;
  const lineHeight = fontSize * typography.lineHeight;
  const letterSpacing = typography.letterSpacing * fontSize;

  ctx.save();
  ctx.fillStyle = theme.text;
  ctx.textBaseline = 'top';
  ctx.textAlign = align;
  ctx.font = `${typography.fontWeight} ${fontSize}px ${typography.fontFamily}`;

  let y = block.y;
  const x =
    align === 'center'
      ? block.x + block.width / 2
      : align === 'right'
        ? block.x + block.width
        : block.x;

  for (const line of lines) {
    const startY = y;
    const fs = line.heading ? fontSize * 1.35 : fontSize;
    const weight = line.bold || line.heading ? 700 : typography.fontWeight;
    const style = line.italic ? 'italic ' : '';
    ctx.font = `${style}${weight} ${fs}px ${typography.fontFamily}`;

    const wrapped = wrapText(ctx, line.text, block.width);
    for (const segment of wrapped) {
      if (letterSpacing !== 0) {
        drawSpacedText(ctx, segment, x, y, letterSpacing, align);
      } else {
        ctx.fillText(segment, x, y);
      }
      y += (line.heading ? fs * 1.2 : lineHeight);
      if (y > block.y + block.height) break;
    }
    if (line.list) {
      ctx.fillStyle = theme.accent;
      ctx.fillRect(block.x, startY + fontSize * 0.35, 4, fontSize * 0.5);
      ctx.fillStyle = theme.text;
    }
  }
  ctx.restore();
}

function drawCodeBlock(
  ctx: CanvasRenderingContext2D,
  block: EditorState['blocks'][0],
  state: EditorState,
  theme: Theme
): void {
  const pad = 24;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, block.x, block.y, block.width, block.height, 12);
  ctx.fill();
  ctx.strokeStyle = theme.accent + '44';
  ctx.lineWidth = 1;
  ctx.stroke();

  const lines = block.content.split('\n');
  const fontSize = state.typography.fontSize;
  const lineHeight = fontSize * state.typography.lineHeight;
  ctx.font = `400 ${fontSize}px ${state.typography.fontFamily}`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  let y = block.y + pad;
  const colors = ['#f472b6', '#a78bfa', '#34d399', '#fbbf24', '#60a5fa', theme.text];

  lines.forEach((line, i) => {
    const color = colors[i % colors.length];
    ctx.fillStyle = color;
    ctx.fillText(line.slice(0, 80), block.x + pad, y);
    y += lineHeight;
  });
  ctx.restore();
}

function drawAccentBar(
  ctx: CanvasRenderingContext2D,
  state: EditorState,
  theme: Theme
): void {
  if (state.templateId === 'quote-card' || state.templateId === 'announcement') {
    ctx.save();
    ctx.fillStyle = theme.accent;
    const barW = state.width * 0.12;
    ctx.fillRect((state.width - barW) / 2, state.height * 0.88, barW, 3);
    ctx.restore();
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function drawSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: string
): void {
  const chars = text.split('');
  let totalW = chars.reduce((s, c) => s + ctx.measureText(c).width + spacing, -spacing);
  let startX = x;
  if (align === 'center') startX = x - totalW / 2;
  if (align === 'right') startX = x - totalW;
  chars.forEach((c) => {
    ctx.fillText(c, startX, y);
    startX += ctx.measureText(c).width + spacing;
  });
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

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpeg' | 'webp',
  quality = 0.92
): Promise<Blob | null> {
  const mime =
    format === 'png'
      ? 'image/png'
      : format === 'jpeg'
        ? 'image/jpeg'
        : 'image/webp';
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), mime, quality);
  });
}

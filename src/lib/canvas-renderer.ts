import type { EditorState, RenderOptions, Theme } from '../types';
import { drawBackground, drawBackgroundImage, drawNoise, colorWithAlpha } from './backgrounds';
import { drawThemeDecorations, drawMasthead } from './theme-decorations';
import { getTheme } from './themes';
import { parseText } from '../utils/text-parser';

export async function renderToCanvas(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  state: EditorState,
  options: RenderOptions = {}
): Promise<void> {
  const scale = options.scale ?? 1;
  const dpr = Math.max(options.dpr ?? 1, 1);
  const w = state.width;
  const h = state.height;
  const displayW = Math.round(w * scale);
  const displayH = Math.round(h * scale);
  const bufferW = Math.round(displayW * dpr);
  const bufferH = Math.round(displayH * dpr);

  if (canvas instanceof HTMLCanvasElement) {
    if (canvas.width !== bufferW || canvas.height !== bufferH) {
      canvas.width = bufferW;
      canvas.height = bufferH;
    }
    canvas.style.width = `${displayW}px`;
    canvas.style.height = `${displayH}px`;
  } else {
    // OffscreenCanvas dimensions set via constructor or reassignment
    if ('width' in canvas) {
      (canvas as OffscreenCanvas).width = bufferW;
      (canvas as OffscreenCanvas).height = bufferH;
    }
  }

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
  if (!ctx) return;

  // Ultra-HD Geometric Precision & Smoothing
  if ('textRendering' in ctx) {
    (ctx as any).textRendering = 'geometricPrecision';
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
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

  // Studio Mockup Frame
  const cardBounds = drawCardFrame(ctx, w, h, state, theme);

  if (state.showMasthead && !cardBounds) {
    drawMasthead(ctx, w, h, theme.accent);
  }

  for (const block of state.blocks) {
    if (block.isCode) {
      drawCodeBlock(ctx, block, state, theme);
    } else {
      drawTextBlock(ctx, block, state, theme);
    }
  }

  if (state.author?.showSignature && state.frameStyle !== 'tweet') {
    drawAuthorSignature(ctx, w, h, state, theme, cardBounds);
  }

  if (!cardBounds) {
    drawAccentBar(ctx, state, theme);
  }
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
  ctx.textBaseline = 'top';
  // Note: we don't set ctx.textAlign here because we align manually when drawing segments
  ctx.textAlign = 'left';

  let y = block.y;

  for (const line of lines) {
    const startY = y;
    const fs = line.heading ? fontSize * 1.35 : fontSize;
    const weight = line.bold || line.heading ? 700 : typography.fontWeight;
    const style = line.italic ? 'italic ' : '';
    ctx.font = `${style}${weight} ${fs}px ${typography.fontFamily}`;

    // Build character style map
    const charStyles: { bold?: boolean; italic?: boolean; color?: string }[] = [];
    if (line.spans) {
      for (const span of line.spans) {
        for (let i = 0; i < span.text.length; i++) {
          charStyles.push({ bold: span.bold, italic: span.italic, color: span.color });
        }
      }
    }

    const wrapped = wrapText(ctx, line.text, block.width);
    let origIdx = 0;

    for (const segmentText of wrapped) {
      // Build styled segments for this wrapped line
      const segments: { text: string; bold?: boolean; italic?: boolean; color?: string }[] = [];
      for (let i = 0; i < segmentText.length; i++) {
        const char = segmentText[i];
        while (origIdx < line.text.length && line.text[origIdx] !== char && (line.text[origIdx] === ' ' || line.text[origIdx] === '\n')) {
          origIdx++;
        }
        const style = charStyles[origIdx] || {};
        const lastSeg = segments[segments.length - 1];
        if (lastSeg && lastSeg.bold === style.bold && lastSeg.italic === style.italic && lastSeg.color === style.color) {
          lastSeg.text += char;
        } else {
          segments.push({ text: char, ...style });
        }
        origIdx++;
      }

      // Calculate total width of the line segment
      let totalWidth = 0;
      const segmentWidths: number[] = [];

      for (const seg of segments) {
        const segFs = line.heading ? fontSize * 1.35 : fontSize;
        const segWeight = seg.bold || line.heading ? 700 : typography.fontWeight;
        const segStyle = seg.italic ? 'italic ' : '';
        ctx.font = `${segStyle}${segWeight} ${segFs}px ${typography.fontFamily}`;

        let w = 0;
        if (letterSpacing !== 0) {
          w = seg.text.split('').reduce((s, c) => s + ctx.measureText(c).width + letterSpacing, -letterSpacing);
        } else {
          w = ctx.measureText(seg.text).width;
        }
        segmentWidths.push(w);
        totalWidth += w;
      }

      let startX = block.x;
      if (align === 'center') {
        startX = block.x + (block.width - totalWidth) / 2;
      } else if (align === 'right') {
        startX = block.x + block.width - totalWidth;
      }

      // Draw each segment of the wrapped line
      for (let sIdx = 0; sIdx < segments.length; sIdx++) {
        const seg = segments[sIdx];
        const segFs = line.heading ? fontSize * 1.35 : fontSize;
        const segWeight = seg.bold || line.heading ? 700 : typography.fontWeight;
        const segStyle = seg.italic ? 'italic ' : '';

        ctx.font = `${segStyle}${segWeight} ${segFs}px ${typography.fontFamily}`;
        ctx.fillStyle = seg.color || typography.textColor || theme.text;

        if (letterSpacing !== 0) {
          drawSpacedText(ctx, seg.text, startX, y, letterSpacing, 'left');
        } else {
          ctx.fillText(seg.text, startX, y);
        }

        startX += segmentWidths[sIdx];
      }

      y += (line.heading ? fs * 1.2 : lineHeight);
      if (y > block.y + block.height) break;
    }

    if (line.list) {
      ctx.fillStyle = theme.accent;
      ctx.fillRect(block.x, startY + fontSize * 0.35, 4, fontSize * 0.5);
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
  const colors = ['#f472b6', '#a78bfa', '#34d399', '#fbbf24', '#60a5fa', state.typography.textColor || theme.text];

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

function isThemeLight(theme: Theme): boolean {
  return theme.id === 'economist' || theme.id === 'kinfolk' || theme.id === 'apple-notes';
}

function drawCardFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: EditorState,
  theme: Theme
): { cardX: number; cardY: number; cardW: number; cardH: number } | null {
  const frame = state.frameStyle || 'none';
  if (frame === 'none') return null;

  const pad = state.cardPadding ?? 56;
  const cardX = pad;
  const cardY = pad;
  const cardW = Math.max(100, w - pad * 2);
  const cardH = Math.max(100, h - pad * 2);
  const radius = Math.min(cardW / 2, cardH / 2, state.cardRadius ?? 16);
  const shadow = state.cardShadow ?? 'float';
  const isLight = isThemeLight(theme);

  ctx.save();

  // 1. Multi-Stage Studio Drop Shadows
  if (shadow !== 'none') {
    if (shadow === 'subtle') {
      ctx.save();
      ctx.shadowColor = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 10;
      roundRect(ctx, cardX, cardY, cardW, cardH, radius);
      ctx.fillStyle = isLight ? '#ffffff' : '#0e1118';
      ctx.fill();
      ctx.restore();
    } else if (shadow === 'float') {
      // Atmospheric bounce blur
      ctx.save();
      ctx.shadowColor = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.44)';
      ctx.shadowBlur = 56;
      ctx.shadowOffsetY = 28;
      roundRect(ctx, cardX, cardY, cardW, cardH, radius);
      ctx.fillStyle = isLight ? '#ffffff' : '#0e1118';
      ctx.fill();
      ctx.restore();

      // Tight contact ambient occlusion
      ctx.save();
      ctx.shadowColor = isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.32)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 5;
      roundRect(ctx, cardX, cardY, cardW, cardH, radius);
      ctx.fillStyle = isLight ? '#ffffff' : '#0e1118';
      ctx.fill();
      ctx.restore();
    } else if (shadow === 'glow') {
      // Cyber Neon Glow
      ctx.save();
      ctx.shadowColor = colorWithAlpha(theme.accent, 0.45);
      ctx.shadowBlur = 50;
      ctx.shadowOffsetY = 6;
      roundRect(ctx, cardX, cardY, cardW, cardH, radius);
      ctx.fillStyle = isLight ? '#ffffff' : '#0e1118';
      ctx.fill();
      ctx.restore();

      // Ambient contact shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 4;
      roundRect(ctx, cardX, cardY, cardW, cardH, radius);
      ctx.fillStyle = isLight ? '#ffffff' : '#0e1118';
      ctx.fill();
      ctx.restore();
    }
  }

  // 2. Card Body Fill with Clipping
  ctx.save();
  roundRect(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.clip();

  if (frame === 'glass') {
    const grad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    if (isLight) {
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.88)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.68)');
    } else {
      grad.addColorStop(0, 'rgba(22, 27, 38, 0.72)');
      grad.addColorStop(1, 'rgba(12, 15, 22, 0.82)');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(cardX, cardY, cardW, cardH);
  } else if (frame === 'editorial') {
    ctx.fillStyle = isLight ? '#faf9f6' : '#0d0f15';
    ctx.fillRect(cardX, cardY, cardW, cardH);
  } else {
    ctx.fillStyle = isLight ? '#ffffff' : '#0e1118';
    ctx.fillRect(cardX, cardY, cardW, cardH);
  }

  // 3. Render Chrome Elements
  if (frame === 'macos') {
    drawMacOsChrome(ctx, cardX, cardY, cardW, isLight);
  } else if (frame === 'browser') {
    drawBrowserChrome(ctx, cardX, cardY, cardW, isLight, theme);
  } else if (frame === 'tweet') {
    drawTweetChrome(ctx, cardX, cardY, cardW, isLight, theme, state);
  } else if (frame === 'editorial') {
    drawEditorialChrome(ctx, cardX, cardY, cardW, cardH, isLight, theme);
  }

  ctx.restore(); // end clip

  // 4. Inner Specular Highlight / Border
  ctx.save();
  if (frame === 'glass') {
    const strokeGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    strokeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
    strokeGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.18)');
    strokeGrad.addColorStop(1, 'rgba(255, 255, 255, 0.06)');
    ctx.strokeStyle = strokeGrad;
    ctx.lineWidth = 1.5;
  } else {
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
  }
  roundRect(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.stroke();
  ctx.restore();

  ctx.restore(); // end frame save

  return { cardX, cardY, cardW, cardH };
}

function drawMacOsChrome(
  ctx: CanvasRenderingContext2D,
  cardX: number,
  cardY: number,
  cardW: number,
  isLight: boolean
): void {
  const barH = 46;
  ctx.save();

  // Header background tint
  ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)';
  ctx.fillRect(cardX, cardY, cardW, barH);

  // Subtle divider
  ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.07)' : 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX, cardY + barH);
  ctx.lineTo(cardX + cardW, cardY + barH);
  ctx.stroke();

  // Traffic lights
  const dotY = cardY + 23;
  const dots = [
    { x: cardX + 24, c: '#ff5f56', stroke: '#e0443e' }, // close
    { x: cardX + 44, c: '#ffbd2e', stroke: '#dea123' }, // minimize
    { x: cardX + 64, c: '#27c93f', stroke: '#1aab29' }, // zoom
  ];

  for (const d of dots) {
    ctx.beginPath();
    ctx.arc(d.x, dotY, 6, 0, Math.PI * 2);
    ctx.fillStyle = d.c;
    ctx.fill();
    ctx.strokeStyle = d.stroke;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Specular gloss arc
    ctx.beginPath();
    ctx.arc(d.x - 1.2, dotY - 1.5, 2.2, 0, Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 0.75;
    ctx.stroke();
  }

  // Centered window title
  ctx.font = '500 12px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.35)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('typeframe.studio', cardX + cardW / 2, dotY);

  ctx.restore();
}

function drawBrowserChrome(
  ctx: CanvasRenderingContext2D,
  cardX: number,
  cardY: number,
  cardW: number,
  isLight: boolean,
  theme: Theme
): void {
  const barH = 50;
  ctx.save();

  // Header background tint
  ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.025)' : 'rgba(255, 255, 255, 0.025)';
  ctx.fillRect(cardX, cardY, cardW, barH);

  // Subtle divider
  ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.07)' : 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX, cardY + barH);
  ctx.lineTo(cardX + cardW, cardY + barH);
  ctx.stroke();

  // 3 Navigation pills on left
  const dotY = cardY + 25;
  const navDots = [cardX + 22, cardX + 36, cardX + 50];
  ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.22)';
  for (const x of navDots) {
    ctx.beginPath();
    ctx.arc(x, dotY, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Address Bar in center
  const pillW = Math.min(cardW * 0.55, 360);
  const pillH = 28;
  const pillX = cardX + (cardW - pillW) / 2;
  const pillY = cardY + 11;

  ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.045)' : 'rgba(255, 255, 255, 0.06)';
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();

  ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.stroke();

  // Lock icon
  const lockX = pillX + 16;
  const lockY = pillY + 14;
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  // Shackle
  ctx.arc(lockX, lockY - 1, 3.5, Math.PI, 0, false);
  ctx.stroke();
  // Lock body
  ctx.fillStyle = theme.accent;
  roundRect(ctx, lockX - 4.5, lockY - 1, 9, 7, 1.5);
  ctx.fill();

  // URL text
  ctx.font = '400 12px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.65)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('https://typeframe.io', lockX + 12, pillY + pillH / 2);

  ctx.restore();
}

function drawVerifiedBadge(ctx: CanvasRenderingContext2D, x: number, y: number, radius = 7.5): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#1d9bf0';
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = radius * 0.28;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - radius * 0.38, y);
  ctx.lineTo(x - radius * 0.1, y + radius * 0.3);
  ctx.lineTo(x + radius * 0.4, y - radius * 0.28);
  ctx.stroke();
  ctx.restore();
}

function drawTweetChrome(
  ctx: CanvasRenderingContext2D,
  cardX: number,
  cardY: number,
  cardW: number,
  isLight: boolean,
  theme: Theme,
  state: EditorState
): void {
  const barH = 76;
  ctx.save();

  const author = state.author ?? {
    name: 'Alex Rivera',
    handle: '@arivera',
    verified: true,
  };

  const name = author.name || 'Alex Rivera';
  const handle = author.handle ? (author.handle.startsWith('@') ? author.handle : `@${author.handle}`) : '@arivera';
  const hasVerified = author.verified !== false;

  // Divider line
  ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 24, cardY + barH);
  ctx.lineTo(cardX + cardW - 24, cardY + barH);
  ctx.stroke();

  // Author Avatar
  const avRadius = 22;
  const avX = cardX + 32 + avRadius;
  const avY = cardY + 38;

  const avGrad = ctx.createLinearGradient(avX - avRadius, avY - avRadius, avX + avRadius, avY + avRadius);
  avGrad.addColorStop(0, theme.accent);
  avGrad.addColorStop(1, '#c084fc');
  ctx.beginPath();
  ctx.arc(avX, avY, avRadius, 0, Math.PI * 2);
  ctx.fillStyle = avGrad;
  ctx.fill();

  // Initials in avatar
  const initial = name.charAt(0).toUpperCase();
  ctx.font = '700 16px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initial, avX, avY + 1);

  // Author Name
  const textLeft = avX + avRadius + 14;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = '700 16px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = isLight ? '#0f1419' : '#f7f9f9';
  ctx.fillText(name, textLeft, cardY + 23);

  const nameW = ctx.measureText(name).width;

  // Verified Badge
  if (hasVerified) {
    drawVerifiedBadge(ctx, textLeft + nameW + 14, cardY + 32, 7.5);
  }

  // Handle
  ctx.font = '400 14px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = isLight ? '#536471' : '#8899a6';
  ctx.fillText(handle, textLeft, cardY + 44);

  // Top-Right decorative quote mark
  ctx.font = '700 32px serif';
  ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.18)';
  ctx.textAlign = 'right';
  ctx.fillText('“', cardX + cardW - 32, cardY + 44);

  ctx.restore();
}

function drawEditorialChrome(
  ctx: CanvasRenderingContext2D,
  cardX: number,
  cardY: number,
  cardW: number,
  cardH: number,
  isLight: boolean,
  theme: Theme
): void {
  ctx.save();

  // Inner hairline border with 10px inset
  const inset = 10;
  ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.strokeRect(cardX + inset, cardY + inset, cardW - inset * 2, cardH - inset * 2);

  // Corner registration crosshairs
  const crossLen = 6;
  const corners = [
    { x: cardX + inset, y: cardY + inset },
    { x: cardX + cardW - inset, y: cardY + inset },
    { x: cardX + inset, y: cardY + cardH - inset },
    { x: cardX + cardW - inset, y: cardY + cardH - inset },
  ];

  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1.2;
  for (const c of corners) {
    ctx.beginPath();
    ctx.moveTo(c.x - crossLen, c.y);
    ctx.lineTo(c.x + crossLen, c.y);
    ctx.moveTo(c.x, c.y - crossLen);
    ctx.lineTo(c.x, c.y + crossLen);
    ctx.stroke();
  }

  // Gallery Masthead Header
  ctx.font = '600 11px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = theme.accent;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.letterSpacing = '3px';
  ctx.fillText('TYPEFRAME ARCHIVE • EDITORIAL EDITION', cardX + cardW / 2, cardY + 22);

  // Footer Issue Label
  ctx.font = '500 10px ui-monospace, monospace';
  ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.35)';
  ctx.fillText('REF. // 004-TF', cardX + cardW / 2, cardY + cardH - 26);

  ctx.restore();
}

function drawAuthorSignature(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: EditorState,
  theme: Theme,
  cardBounds: { cardX: number; cardY: number; cardW: number; cardH: number } | null
): void {
  const author = state.author;
  if (!author || !author.name) return;

  const isLight = isThemeLight(theme);
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  const name = author.name;
  const handle = author.handle ? (author.handle.startsWith('@') ? author.handle : `@${author.handle}`) : '';
  const hasVerified = author.verified !== false;

  ctx.font = '600 13px system-ui, -apple-system, sans-serif';
  const nameW = ctx.measureText(name).width;
  ctx.font = '400 12px system-ui, -apple-system, sans-serif';
  const handleW = handle ? ctx.measureText(handle).width : 0;

  const badgeW = hasVerified ? 16 : 0;
  const avatarSize = 22;
  const padH = 12;
  const pillW = padH * 2 + avatarSize + 8 + nameW + (hasVerified ? 6 + badgeW : 0) + (handle ? 8 + handleW : 0);
  const pillH = 34;

  const pillX = cardBounds
    ? cardBounds.cardX + cardBounds.cardW - pillW - 20
    : w - pillW - 36;
  const pillY = cardBounds
    ? cardBounds.cardY + cardBounds.cardH - pillH - 18
    : h - pillH - 32;

  // Background pill with subtle shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 18, 26, 0.85)';
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.stroke();

  // Avatar circle
  const avatarX = pillX + padH + avatarSize / 2;
  const avatarY = pillY + pillH / 2;
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
  ctx.fillStyle = theme.accent;
  ctx.fill();

  // Initial
  const initial = name.charAt(0).toUpperCase();
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(initial, avatarX, avatarY + 0.5);

  // Author Name
  let curX = pillX + padH + avatarSize + 8;
  ctx.textAlign = 'left';
  ctx.font = '600 13px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
  ctx.fillText(name, curX, pillY + pillH / 2);
  curX += nameW;

  // Verified Badge
  if (hasVerified) {
    drawVerifiedBadge(ctx, curX + 11, pillY + pillH / 2, 6.5);
    curX += badgeW;
  }

  // Handle
  if (handle) {
    curX += 6;
    ctx.font = '400 12px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
    ctx.fillText(handle, curX, pillY + pillH / 2);
  }

  ctx.restore();
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

import type { EditorState, Theme } from '../types';
import { getTheme } from './themes';
import { parseText } from '../utils/text-parser';
import { escapeXml } from '../utils/dom';

export function renderToSvg(state: EditorState): string {
  const { width, height } = state;
  const theme = getTheme(state.themeId);
  const bg = state.background;
  const bgMarkup = svgBackground(width, height, bg, theme);

  const blocks = state.blocks
    .map((b) =>
      b.isCode ? svgCodeBlock(b, state, theme) : svgTextBlock(b, state, theme)
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    ${svgDefs(bg)}
  </defs>
  ${bgMarkup}
  ${blocks}
</svg>`;
}

function svgDefs(bg: EditorState['background']): string {
  if (bg.type === 'gradient' && bg.gradientStops) {
    const stops = bg.gradientStops
      .map((s) => `<stop offset="${s.position * 100}%" stop-color="${s.color}"/>`)
      .join('');
    return `<linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">${stops}</linearGradient>`;
  }
  return '';
}

function svgBackground(
  w: number,
  h: number,
  bg: EditorState['background'],
  theme: Theme
): string {
  const effective = bg.type === 'solid' ? theme.background : bg;
  if (effective.type === 'gradient') {
    return `<rect width="${w}" height="${h}" fill="url(#bg-grad)"/>`;
  }
  if (effective.type === 'solid' || effective.solidColor) {
    const c = effective.solidColor ?? theme.background.solidColor ?? '#0f0f12';
    return `<rect width="${w}" height="${h}" fill="${c}"/>`;
  }
  const colors = effective.meshColors ?? ['#0f172a', '#1e293b'];
  return colors
    .map(
      (c, i) =>
        `<circle cx="${w * (0.2 + i * 0.2)}" cy="${h * (0.3 + (i % 2) * 0.4)}" r="${Math.max(w, h) * 0.45}" fill="${c}" opacity="0.5"/>`
    )
    .join('\n');
}

function svgTextBlock(
  block: EditorState['blocks'][0],
  state: EditorState,
  theme: Theme
): string {
  const { typography, textMode } = state;
  const lines = parseText(block.content, textMode);
  const anchor =
    typography.textAlign === 'center'
      ? 'middle'
      : typography.textAlign === 'right'
        ? 'end'
        : 'start';
  const x =
    typography.textAlign === 'center'
      ? block.x + block.width / 2
      : typography.textAlign === 'right'
        ? block.x + block.width
        : block.x;

  let y = block.y + typography.fontSize;
  const tspans = lines
    .map((line) => {
      const fs = line.heading ? typography.fontSize * 1.35 : typography.fontSize;
      const weight = line.bold || line.heading ? 700 : typography.fontWeight;
      const el = `<tspan x="${x}" dy="${y === block.y + typography.fontSize ? 0 : typography.fontSize * typography.lineHeight}" font-size="${fs}" font-weight="${weight}">${escapeXml(line.text)}</tspan>`;
      y += typography.fontSize * typography.lineHeight;
      return el;
    })
    .join('');

  return `<text x="${x}" y="${block.y + typography.fontSize}" fill="${theme.text}" font-family="${typography.fontFamily}" font-size="${typography.fontSize}" text-anchor="${anchor}" letter-spacing="${typography.letterSpacing}em">${tspans}</text>`;
}

function svgCodeBlock(
  block: EditorState['blocks'][0],
  state: EditorState,
  theme: Theme
): string {
  const lines = block.content.split('\n');
  const lh = state.typography.fontSize * state.typography.lineHeight;
  const tspans = lines
    .map((line, i) => {
      const dy = i === 0 ? 0 : lh;
      return `<tspan x="${block.x + 24}" dy="${dy}" fill="${theme.accent}">${escapeXml(line)}</tspan>`;
    })
    .join('');
  return `<rect x="${block.x}" y="${block.y}" width="${block.width}" height="${block.height}" rx="12" fill="rgba(0,0,0,0.35)" stroke="${theme.accent}" stroke-opacity="0.3"/>
  <text font-family="${state.typography.fontFamily}" font-size="${state.typography.fontSize}">${tspans}</text>`;
}

import type { EditorState, Theme } from '../types';
import { getTheme } from './themes';
import { parseText } from '../utils/text-parser';
import { escapeXml } from '../utils/dom';
import { imageCache } from './backgrounds';

export function renderToSvg(state: EditorState): string {
  const { width, height } = state;
  const theme = getTheme(state.themeId);
  const bg = state.background;
  
  const bgMarkup = svgBackground(width, height, bg, theme);
  const decorationsMarkup = svgDecorations(width, height, theme);

  const blocks = state.blocks
    .map((b) =>
      b.isCode ? svgCodeBlock(b, state, theme) : svgTextBlock(b, state, theme)
    )
    .join('\n');

  const accentBarMarkup = svgAccentBar(width, height, state, theme);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    ${svgDefs(width, height, bg, theme)}
  </defs>
  ${bgMarkup}
  ${decorationsMarkup}
  ${blocks}
  ${accentBarMarkup}
</svg>`;
}

function svgDefs(w: number, h: number, bg: EditorState['background'], theme: Theme): string {
  let defs = '';
  
  // Linear gradients for backgrounds
  if (bg.type === 'gradient' && bg.gradientStops) {
    const angle = ((bg.gradientAngle ?? 135) * Math.PI) / 180;
    const cx = w / 2;
    const cy = h / 2;
    const len = Math.sqrt(w * w + h * h) / 2;
    const x0 = cx - Math.cos(angle) * len;
    const y0 = cy - Math.sin(angle) * len;
    const x1 = cx + Math.cos(angle) * len;
    const y1 = cy + Math.sin(angle) * len;
    
    const stops = bg.gradientStops
      .map((s) => `<stop offset="${s.position * 100}%" stop-color="${s.color}"/>`)
      .join('');
    defs += `<linearGradient id="bg-grad" gradientUnits="userSpaceOnUse" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}">${stops}</linearGradient>\n`;
  }
  
  // Radial gradients for mesh backgrounds
  if (bg.type === 'mesh' || bg.type === 'glass') {
    const colors = bg.meshColors ?? ['#0f172a', '#1e293b', '#312e81', '#0e7490'];
    const blobs = [
      { id: 0, x: 0.2, y: 0.3, r: 0.55 },
      { id: 1, x: 0.8, y: 0.2, r: 0.5 },
      { id: 2, x: 0.5, y: 0.85, r: 0.6 },
      { id: 3, x: 0.1, y: 0.75, r: 0.45 },
    ];
    blobs.forEach((b) => {
      const c = colors[b.id] ?? colors[0];
      defs += `<radialGradient id="mesh-blob-${b.id}" cx="${b.x * 100}%" cy="${b.y * 100}%" r="${b.r * 100}%" fx="${b.x * 100}%" fy="${b.y * 100}%">
        <stop offset="0%" stop-color="${c}" stop-opacity="0.8"/>
        <stop offset="60%" stop-color="${c}" stop-opacity="0.27"/>
        <stop offset="100%" stop-color="${c}" stop-opacity="0"/>
      </radialGradient>\n`;
    });
  }

  // Vignette gradient
  if (theme.decorations?.includes('vignette')) {
    defs += `<radialGradient id="vignette-grad" cx="50%" cy="50%" r="72%">
      <stop offset="0%" stop-color="transparent" stop-opacity="0"/>
      <stop offset="100%" stop-color="black" stop-opacity="0.55"/>
    </radialGradient>\n`;
  }

  // Glow orb gradient
  if (theme.decorations?.includes('glow-orb')) {
    defs += `<radialGradient id="glow-orb-grad" cx="85%" cy="15%" r="45%" fx="85%" fy="15%">
      <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.27"/>
      <stop offset="50%" stop-color="${theme.accent}" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="transparent" stop-opacity="0"/>
    </radialGradient>\n`;
  }

  // Accent rule linear and radial gradients
  if (theme.decorations?.includes('accent-rule')) {
    defs += `<linearGradient id="accent-rule-line" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0"/>
      <stop offset="20%" stop-color="${theme.accent}"/>
      <stop offset="80%" stop-color="${theme.accent}"/>
      <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="accent-rule-glow" cx="50%" cy="92%" r="35%">
      <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="transparent" stop-opacity="0"/>
    </radialGradient>\n`;
  }

  // Scanlines pattern
  if (theme.decorations?.includes('scanlines')) {
    defs += `<pattern id="scanlines-pat" width="10" height="6" patternUnits="userSpaceOnUse">
      <rect width="10" height="1" fill="${theme.accent}" fill-opacity="0.12"/>
      <rect y="3" width="10" height="1" fill="black" fill-opacity="0.4"/>
    </pattern>\n`;
  }

  // Grid pattern
  if (theme.decorations?.includes('grid')) {
    const gap = Math.max(32, Math.round(w / 24));
    defs += `<pattern id="grid-pat" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse">
      <path d="M ${gap} 0 L 0 0 0 ${gap}" fill="none" stroke="${theme.accent}" stroke-width="1" stroke-opacity="0.09"/>
    </pattern>\n`;
  }

  // Grain / noise filter
  if (theme.decorations?.includes('grain') || bg.type === 'noise') {
    const intensity = theme.decorations?.includes('grain') ? 0.04 : (bg.noiseIntensity ?? 0.06);
    defs += `<filter id="noise-filter">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise"/>
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${intensity} 0"/>
      <feComposite operator="in" in2="SourceGraphic"/>
    </filter>\n`;
  }

  // Vertical grid pattern
  if (theme.decorations?.includes('vertical-grid')) {
    const gap = Math.max(32, w * 0.045);
    defs += `<pattern id="vertical-grid-pat" width="${gap}" height="${h}" patternUnits="userSpaceOnUse">
      <line x1="0" y1="${h * 0.08}" x2="0" y2="${h * 0.92}" stroke="${theme.accent}" stroke-width="1" stroke-opacity="0.043"/>
    </pattern>\n`;
  }

  // Braun grid pattern
  if (theme.decorations?.includes('braun-grid')) {
    const dotGap = Math.max(32, w * 0.05);
    defs += `<pattern id="braun-grid-pat" width="${dotGap}" height="${dotGap}" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="rgba(26, 26, 26, 0.06)"/>
    </pattern>\n`;
  }

  return defs;
}

function svgBackground(
  w: number,
  h: number,
  bg: EditorState['background'],
  theme: Theme
): string {
  if (bg.type === 'solid') {
    const c = bg.solidColor ?? theme.background.solidColor ?? '#0f0f12';
    return `<rect width="${w}" height="${h}" fill="${c}"/>`;
  }

  if (bg.type === 'gradient') {
    return `<rect width="${w}" height="${h}" fill="url(#bg-grad)"/>`;
  }

  if (bg.type === 'noise') {
    const baseColorMarkup = bg.solidColor 
      ? `<rect width="${w}" height="${h}" fill="${bg.solidColor}"/>`
      : `<rect width="${w}" height="${h}" fill="url(#bg-grad)"/>`;
    return `${baseColorMarkup}\n  <rect width="${w}" height="${h}" fill="white" filter="url(#noise-filter)"/>`;
  }

  if (bg.type === 'image' && bg.imageUrl) {
    const cached = imageCache.get(bg.imageUrl);
    let imageMarkup = '';
    if (cached) {
      const sizeMode = bg.imageSizeMode ?? 'cover';
      const imageScale = bg.imageScale ?? 1.0;
      let sw = cached.width;
      let sh = cached.height;
      let scale = 1;

      if (sizeMode === 'cover') {
        scale = Math.max(w / cached.width, h / cached.height);
      } else if (sizeMode === 'contain') {
        scale = Math.min(w / cached.width, h / cached.height);
      } else if (sizeMode === 'stretch') {
        sw = w;
        sh = h;
        scale = 1;
      } else if (sizeMode === 'original') {
        scale = 1;
      }

      if (sizeMode !== 'stretch') {
        scale *= imageScale;
        sw = cached.width * scale;
        sh = cached.height * scale;
      }
      
      const imgX = (w - sw) / 2;
      const imgY = (h - sh) / 2;
      imageMarkup = `<image href="${bg.imageUrl}" x="${imgX}" y="${imgY}" width="${sw}" height="${sh}" opacity="${bg.imageOpacity ?? 0.9}"/>`;
    } else {
      const aspect = bg.imageSizeMode === 'contain' ? 'xMidYMid meet' : bg.imageSizeMode === 'stretch' ? 'none' : 'xMidYMid slice';
      imageMarkup = `<image href="${bg.imageUrl}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="${aspect}" opacity="${bg.imageOpacity ?? 0.9}"/>`;
    }
    const fallbackColor = bg.solidColor ?? '#18181b';
    return `<rect width="${w}" height="${h}" fill="${fallbackColor}"/>\n  ${imageMarkup}`;
  }

  const colors = bg.meshColors ?? ['#0f172a', '#1e293b', '#312e81', '#0e7490'];
  let markup = `<rect width="${w}" height="${h}" fill="${colors[0]}"/>\n`;
  for (let i = 0; i < 4; i++) {
    markup += `  <rect width="${w}" height="${h}" fill="url(#mesh-blob-${i})"/>\n`;
  }

  if (bg.type === 'mesh' && bg.noiseIntensity) {
    markup += `  <rect width="${w}" height="${h}" fill="white" filter="url(#noise-filter)"/>\n`;
  }

  if (bg.type === 'glass' || bg.glassBlur) {
    markup += `  <rect width="${w}" height="${h}" fill="rgba(255,255,255,0.06)"/>\n`;
    const margin = w * 0.06;
    markup += `  <rect x="${margin}" y="${margin}" width="${w - margin * 2}" height="${h - margin * 2}" rx="24" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>\n`;
  }

  return markup;
}

function svgDecorations(w: number, h: number, theme: Theme): string {
  let markup = '';
  const list = theme.decorations ?? [];
  const accent = theme.accent;

  for (const d of list) {
    switch (d) {
      case 'vignette':
        markup += `  <rect width="${w}" height="${h}" fill="url(#vignette-grad)"/>\n`;
        break;
      case 'grain':
        markup += `  <rect width="${w}" height="${h}" fill="white" filter="url(#noise-filter)"/>\n`;
        break;
      case 'scanlines':
        markup += `  <rect width="${w}" height="${h}" fill="url(#scanlines-pat)"/>\n`;
        break;
      case 'grid':
        markup += `  <rect width="${w}" height="${h}" fill="url(#grid-pat)"/>\n`;
        break;
      case 'frame': {
        const m = Math.min(w, h) * 0.06;
        markup += `  <rect x="${m}" y="${m}" width="${w - m * 2}" height="${h - m * 2}" fill="none" stroke="${accent}" stroke-width="2" stroke-opacity="0.33"/>\n`;
        break;
      }
      case 'masthead':
        markup += `  <rect width="${w}" height="${h * 0.028}" fill="${accent}"/>\n`;
        markup += `  <text x="${w * 0.08}" y="${h * 0.052}" fill="${accent}" fill-opacity="0.6" font-family="'IBM Plex Sans', sans-serif" font-weight="600" font-size="${Math.round(h * 0.018)}" dominant-baseline="central">TYPEFRAME</text>\n`;
        break;
      case 'glow-orb':
        markup += `  <rect width="${w}" height="${h}" fill="url(#glow-orb-grad)"/>\n`;
        break;
      case 'column-rule':
        markup += `  <rect x="${w * 0.08}" y="${h * 0.12}" width="3" height="${h * 0.76}" fill="${accent}" fill-opacity="0.8"/>\n`;
        break;
      case 'accent-rule':
        markup += `  <rect y="${h * 0.08}" width="${w}" height="2" fill="url(#accent-rule-line)"/>\n`;
        markup += `  <rect y="${h * 0.5}" width="${w}" height="${h * 0.5}" fill="url(#accent-rule-glow)"/>\n`;
        break;
      case 'bezel': {
        const m = w * 0.05;
        markup += `  <rect x="${m}" y="${m}" width="${w - m * 2}" height="${h - m * 2}" rx="16" fill="none" stroke="${accent}" stroke-width="3" stroke-opacity="0.2"/>\n`;
        markup += `  <rect x="${m + 8}" y="${m + 8}" width="${w - m * 2 - 16}" height="${h - m * 2 - 16}" rx="10" fill="${accent}" fill-opacity="0.03"/>\n`;
        break;
      }
      case 'economist-header': {
        const rectW = Math.max(130, w * 0.22);
        const rectH = Math.max(26, h * 0.038);
        markup += `  <rect x="${w * 0.08}" y="${h * 0.13}" width="${w * 0.84}" height="4" fill="${accent}"/>\n`;
        markup += `  <rect x="${w * 0.08}" y="${h * 0.07}" width="${rectW}" height="${rectH}" fill="${accent}"/>\n`;
        markup += `  <text x="${w * 0.08 + rectW / 2}" y="${h * 0.07 + rectH / 2}" fill="#ffffff" font-family="'Playfair Display', Georgia, serif" font-weight="700" font-style="italic" font-size="${rectH * 0.52}" text-anchor="middle" dominant-baseline="central">The Economist</text>\n`;
        break;
      }
      case 'vertical-grid':
        markup += `  <rect x="${w * 0.08}" y="${h * 0.08}" width="${w * 0.84}" height="${h * 0.84}" fill="url(#vertical-grid-pat)"/>\n`;
        break;
      case 'double-frame': {
        const m1 = Math.min(w, h) * 0.05;
        const m2 = m1 + 8;
        markup += `  <rect x="${m1}" y="${m1}" width="${w - m1 * 2}" height="${h - m1 * 2}" fill="none" stroke="${accent}" stroke-width="3" stroke-opacity="0.73"/>\n`;
        markup += `  <rect x="${m2}" y="${m2}" width="${w - m2 * 2}" height="${h - m2 * 2}" fill="none" stroke="${accent}" stroke-width="1" stroke-opacity="0.27"/>\n`;
        break;
      }
      case 'braun-grid':
        markup += `  <rect x="${w * 0.08}" y="${h * 0.08}" width="${w * 0.84}" height="${h * 0.84}" fill="url(#braun-grid-pat)"/>\n`;
        break;
      case 'braun-dials': {
        markup += `  <line x1="${w * 0.08}" y1="${h * 0.89}" x2="${w * 0.92}" y2="${h * 0.89}" stroke="rgba(26, 26, 26, 0.08)" stroke-width="1.5"/>\n`;
        const dialRadius = Math.max(7, h * 0.012);
        const rightX = w * 0.92 - dialRadius;
        const rightY = h * 0.935;
        markup += `  <circle cx="${rightX}" cy="${rightY}" r="${dialRadius}" fill="${accent}" stroke="#ffffff" stroke-width="1.5"/>\n`;
        markup += `  <line x1="${rightX}" y1="${rightY}" x2="${rightX}" y2="${rightY - dialRadius + 2.5}" stroke="#ffffff" stroke-width="1.5"/>\n`;
        markup += `  <circle cx="${rightX - dialRadius * 2.6}" cy="${rightY}" r="${dialRadius}" fill="#4e6e58" stroke="#ffffff" stroke-width="1.5"/>\n`;
        markup += `  <line x1="${rightX - dialRadius * 2.6}" y1="${rightY}" x2="${rightX - dialRadius * 2.6 - dialRadius * 0.6}" y2="${rightY - dialRadius * 0.6}" stroke="#ffffff" stroke-width="1.5"/>\n`;
        break;
      }
      case 'bauhaus-shapes':
        markup += `  <circle cx="${w * 0.82}" cy="${h * 0.18}" r="${Math.min(w, h) * 0.18}" fill="rgba(214, 40, 40, 0.06)"/>\n`;
        markup += `  <rect x="${w * 0.08}" y="${h * 0.66}" width="${w * 0.26}" height="${h * 0.18}" fill="rgba(0, 48, 73, 0.05)"/>\n`;
        markup += `  <line x1="${w * 0.08}" y1="${h * 0.88}" x2="${w * 0.92}" y2="${h * 0.88}" stroke="rgba(27, 27, 27, 0.14)" stroke-width="4"/>\n`;
        break;
    }
  }

  return markup;
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

  let currentY = block.y;
  const bullets: string[] = [];
  
  const tspans = lines
    .map((line, i) => {
      const fs = line.heading ? typography.fontSize * 1.35 : typography.fontSize;
      const weight = line.bold || line.heading ? 700 : typography.fontWeight;
      const style = line.italic ? ' font-style="italic"' : '';
      
      const step = i === 0 ? typography.fontSize : (lines[i-1].heading ? (typography.fontSize * 1.35 * 1.2) : (typography.fontSize * typography.lineHeight));
      
      if (line.list) {
        bullets.push(`<rect x="${block.x}" y="${currentY + step * 0.35}" width="4" height="${typography.fontSize * 0.5}" fill="${theme.accent}"/>`);
      }
      
      currentY += step;
      
      return `<tspan x="${x}" dy="${i === 0 ? typography.fontSize : step}" font-size="${fs}" font-weight="${weight}"${style}>${escapeXml(line.text)}</tspan>`;
    })
    .join('');

  const textMarkup = `<text x="${x}" y="${block.y}" fill="${theme.text}" font-family="${typography.fontFamily}" font-size="${typography.fontSize}" text-anchor="${anchor}" letter-spacing="${typography.letterSpacing}em">${tspans}</text>`;
  
  return [...bullets, textMarkup].join('\n');
}

function svgCodeBlock(
  block: EditorState['blocks'][0],
  state: EditorState,
  theme: Theme
): string {
  const lines = block.content.split('\n');
  const lh = state.typography.fontSize * state.typography.lineHeight;
  const colors = ['#f472b6', '#a78bfa', '#34d399', '#fbbf24', '#60a5fa', theme.text];
  
  const tspans = lines
    .map((line, i) => {
      const color = colors[i % colors.length];
      const dy = i === 0 ? 0 : lh;
      return `<tspan x="${block.x + 24}" dy="${dy}" fill="${color}">${escapeXml(line.slice(0, 80))}</tspan>`;
    })
    .join('');
    
  return `<rect x="${block.x}" y="${block.y}" width="${block.width}" height="${block.height}" rx="12" fill="rgba(0,0,0,0.35)" stroke="${theme.accent}" stroke-opacity="0.3"/>
  <text x="${block.x + 24}" y="${block.y + 24}" dominant-baseline="hanging" font-family="${state.typography.fontFamily}" font-size="${state.typography.fontSize}">${tspans}</text>`;
}

function svgAccentBar(
  w: number,
  h: number,
  state: EditorState,
  theme: Theme
): string {
  if (state.templateId === 'quote-card' || state.templateId === 'announcement') {
    const barW = w * 0.12;
    return `<rect x="${(w - barW) / 2}" y="${h * 0.88}" width="${barW}" height="3" fill="${theme.accent}"/>`;
  }
  return '';
}

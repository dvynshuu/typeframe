import { renderToCanvas } from '../lib/canvas-renderer';
import type { EditorState, ExportFormat } from '../types';

const fontsToLoad = [
  { family: 'Inter', url: '/fonts/Inter-Regular.woff2', weight: '400' },
  { family: 'Inter', url: '/fonts/Inter-Medium.woff2', weight: '500' },
  { family: 'Instrument Serif', url: '/fonts/InstrumentSerif-Regular.woff2', weight: '400', style: 'normal' },
  { family: 'Instrument Serif', url: '/fonts/InstrumentSerif-Italic.woff2', weight: '400', style: 'italic' },
  { family: 'Cormorant Garamond', url: '/fonts/CormorantGaramond-Medium.woff2', weight: '500' },
  { family: 'Cormorant Garamond', url: '/fonts/CormorantGaramond-SemiBold.woff2', weight: '600' },
  { family: 'IBM Plex Sans', url: '/fonts/IBMPlexSans-Regular.woff2', weight: '400' },
  { family: 'IBM Plex Sans', url: '/fonts/IBMPlexSans-Medium.woff2', weight: '500' },
  { family: 'IBM Plex Sans', url: '/fonts/IBMPlexSans-SemiBold.woff2', weight: '600' },
  { family: 'JetBrains Mono', url: '/fonts/JetBrainsMono-Regular.woff2', weight: '400' },
  { family: 'JetBrains Mono', url: '/fonts/JetBrainsMono-Medium.woff2', weight: '500' },
  { family: 'Playfair Display', url: '/fonts/PlayfairDisplay-SemiBold.woff2', weight: '600' },
  { family: 'Playfair Display', url: '/fonts/PlayfairDisplay-Bold.woff2', weight: '700' },
  { family: 'Source Serif 4', url: '/fonts/SourceSerif4-Regular.woff2', weight: '400' },
  { family: 'Source Serif 4', url: '/fonts/SourceSerif4-SemiBold.woff2', weight: '600' }
];

const loadedFonts = new Set<string>();

function isFontRequired(f: (typeof fontsToLoad)[number], state: EditorState): boolean {
  // 1. Primary Typography font
  if (state.typography.fontFamily && state.typography.fontFamily.includes(f.family)) {
    return true;
  }
  // 2. Code blocks or code snippet template
  const hasCode = state.templateId === 'code-snippet' || state.blocks.some((b) => b.isCode);
  if (hasCode && f.family === 'JetBrains Mono') {
    return true;
  }
  // 3. Masthead branding
  if (state.showMasthead && f.family === 'IBM Plex Sans') {
    return true;
  }
  // 4. Browser chrome URL bar
  if (state.frameStyle === 'browser' && f.family === 'JetBrains Mono') {
    return true;
  }
  // 5. Always ensure Inter is available as system sans-serif fallback
  if (f.family === 'Inter') {
    return true;
  }
  return false;
}

async function ensureFontsLoaded(origin: string, state: EditorState) {
  // @ts-ignore
  if (typeof self.fonts === 'undefined' || typeof FontFace === 'undefined') {
    return;
  }

  const needed = fontsToLoad.filter((f) => {
    const key = `${f.family}:${f.weight}:${f.style || 'normal'}`;
    return !loadedFonts.has(key) && isFontRequired(f, state);
  });

  if (needed.length === 0) return;

  const promises = needed.map(async (f) => {
    const key = `${f.family}:${f.weight}:${f.style || 'normal'}`;
    try {
      const fontUrl = new URL(f.url, origin).href;
      // @ts-ignore
      const font = new FontFace(f.family, `url(${fontUrl})`, {
        weight: f.weight,
        style: f.style || 'normal'
      });
      await font.load();
      // @ts-ignore
      self.fonts.add(font);
      loadedFonts.add(key);
    } catch (err) {
      console.warn(`Failed to load font ${f.family} (${f.weight}) in worker:`, err);
    }
  });

  await Promise.all(promises);
}

self.addEventListener('message', async (e: MessageEvent<{ state: EditorState; format: ExportFormat; quality?: number; origin?: string; scaleMultiplier?: number }>) => {
  const { state, format, quality = 0.92, origin = self.location.origin, scaleMultiplier } = e.data;
  const multiplier = scaleMultiplier || state.exportScale || 2;
  try {
    // Dynamically register only required fonts in worker scope before drawing
    await ensureFontsLoaded(origin, state);

    const exportW = Math.round(state.width * multiplier);
    const exportH = Math.round(state.height * multiplier);
    const canvas = new OffscreenCanvas(exportW, exportH);
    await renderToCanvas(canvas, state, { scale: multiplier });
    
    const mime = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
    const blob = await canvas.convertToBlob({ type: mime, quality });
    self.postMessage({ type: 'success', blob });
  } catch (err: any) {
    self.postMessage({ type: 'error', error: err.message || String(err) });
  }
});


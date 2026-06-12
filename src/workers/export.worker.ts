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

let fontsLoaded = false;

async function ensureFontsLoaded(origin: string) {
  if (fontsLoaded) return;
  // @ts-ignore
  if (typeof self.fonts === 'undefined' || typeof FontFace === 'undefined') {
    fontsLoaded = true;
    return;
  }

  const promises = fontsToLoad.map(async (f) => {
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
    } catch (err) {
      console.warn(`Failed to load font ${f.family} (${f.weight}) in worker:`, err);
    }
  });

  await Promise.all(promises);
  fontsLoaded = true;
}

self.addEventListener('message', async (e: MessageEvent<{ state: EditorState; format: ExportFormat; quality?: number; origin?: string }>) => {
  const { state, format, quality = 0.92, origin = self.location.origin } = e.data;
  try {
    // Dynamically register fonts in worker scope before drawing
    await ensureFontsLoaded(origin);

    const canvas = new OffscreenCanvas(state.width, state.height);
    await renderToCanvas(canvas, state, { scale: 1 });
    
    const mime = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
    const blob = await canvas.convertToBlob({ type: mime, quality });
    self.postMessage({ type: 'success', blob });
  } catch (err: any) {
    self.postMessage({ type: 'error', error: err.message || String(err) });
  }
});

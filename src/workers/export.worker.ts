import { renderToCanvas } from '../lib/canvas-renderer';
import { fontAssetsForState } from '../lib/fonts';
import type { EditorState, ExportFormat } from '../types';

const loadedFonts = new Set<string>();
const workerScope = self as typeof self & { fonts?: FontFaceSet };

async function ensureFontsLoaded(origin: string, state: EditorState): Promise<void> {
  if (typeof FontFace === 'undefined' || !workerScope.fonts) return;

  const pending = fontAssetsForState(state)
    .filter((asset) => !loadedFonts.has(asset.file))
    .map(async (asset) => {
      try {
        const url = new URL(asset.file, origin).href;
        const font = new FontFace(asset.family, `url(${url})`, {
          weight: asset.weight,
          style: asset.style,
          display: 'block',
        });
        await font.load();
        workerScope.fonts!.add(font);
        loadedFonts.add(asset.file);
      } catch (err) {
        console.warn(`Could not load ${asset.family} in export worker:`, err);
      }
    });

  await Promise.all(pending);
}

self.addEventListener(
  'message',
  async (
    event: MessageEvent<{
      state: EditorState;
      format: ExportFormat;
      quality?: number;
      origin?: string;
      scaleMultiplier?: number;
    }>
  ) => {
    const { state, format, quality = 0.92, origin = self.location.origin, scaleMultiplier } = event.data;
    const multiplier = scaleMultiplier || state.exportScale || 2;

    try {
      await ensureFontsLoaded(origin, state);

      const exportW = Math.round(state.width * multiplier);
      const exportH = Math.round(state.height * multiplier);
      const canvas = new OffscreenCanvas(exportW, exportH);
      await renderToCanvas(canvas, state, { scale: multiplier });

      const mime = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
      const blob = await canvas.convertToBlob({ type: mime, quality });
      self.postMessage({ type: 'success', blob });
    } catch (err: any) {
      self.postMessage({ type: 'error', error: err?.message || String(err) });
    }
  }
);

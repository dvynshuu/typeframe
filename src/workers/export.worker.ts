import { renderToCanvas } from '../lib/canvas-renderer';
import type { EditorState, ExportFormat } from '../types';

self.addEventListener('message', async (e: MessageEvent<{ state: EditorState; format: ExportFormat; quality?: number }>) => {
  const { state, format, quality = 0.92 } = e.data;
  try {
    const canvas = new OffscreenCanvas(state.width, state.height);
    await renderToCanvas(canvas, state, { scale: 1 });
    
    const mime = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
    const blob = await canvas.convertToBlob({ type: mime, quality });
    self.postMessage({ type: 'success', blob });
  } catch (err: any) {
    self.postMessage({ type: 'error', error: err.message || String(err) });
  }
});

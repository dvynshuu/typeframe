import type { EditorState, ExportFormat } from '../types';
import { renderToCanvas, canvasToBlob } from '../lib/canvas-renderer';
import { renderToSvg } from '../lib/svg-renderer';
import { downloadBlob, downloadText } from './dom';

export function exportFilename(format: ExportFormat, w: number, h: number): string {
  const ext = format === 'jpeg' ? 'jpg' : format;
  return `typeframe-${w}x${h}.${ext}`;
}

function exportViaWorker(
  state: EditorState,
  format: ExportFormat,
  quality = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const worker = new Worker(
        new URL('../workers/export.worker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.addEventListener('message', (e) => {
        const { type, blob, error } = e.data;
        if (type === 'success') {
          resolve(blob);
        } else {
          reject(new Error(error || 'Failed to render image in worker'));
        }
        worker.terminate();
      });

      worker.addEventListener('error', (err) => {
        reject(err);
        worker.terminate();
      });

      worker.postMessage({ state, format, quality, origin: typeof window !== 'undefined' ? window.location.origin : undefined });
    } catch (err) {
      reject(err);
    }
  });
}

export async function exportImage(
  state: EditorState,
  format: ExportFormat,
  quality = 0.92
): Promise<void> {
  if (format === 'svg') {
    const svg = renderToSvg(state);
    downloadText(svg, exportFilename(format, state.width, state.height), 'image/svg+xml');
    return;
  }

  try {
    const blob = await exportViaWorker(state, format, quality);
    downloadBlob(blob, exportFilename(format, state.width, state.height));
  } catch (err) {
    console.warn('Worker export failed, falling back to main thread:', err);
    const canvas = document.createElement('canvas');
    await renderToCanvas(canvas, state, { scale: 1 });
    const blob = await canvasToBlob(
      canvas,
      format === 'png' ? 'png' : format === 'webp' ? 'webp' : 'jpeg',
      quality
    );
    if (blob) {
      downloadBlob(blob, exportFilename(format, state.width, state.height));
    } else {
      throw new Error('Fallback export failed to produce blob');
    }
  }
}



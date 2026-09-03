import type { EditorState, ExportFormat } from '../types';
import { renderToCanvas, canvasToBlob } from '../lib/canvas-renderer';
import { renderToSvg } from '../lib/svg-renderer';
import { downloadBlob, downloadText } from './dom';

export function exportFilename(format: ExportFormat, w: number, h: number, scale = 1): string {
  const ext = format === 'jpeg' ? 'jpg' : format;
  const scaledW = Math.round(w * scale);
  const scaledH = Math.round(h * scale);
  if (scale === 4) {
    return `typeframe-${scaledW}x${scaledH}@4x-4k.${ext}`;
  } else if (scale === 2) {
    return `typeframe-${scaledW}x${scaledH}@2x.${ext}`;
  }
  return `typeframe-${scaledW}x${scaledH}.${ext}`;
}

function exportViaWorker(
  state: EditorState,
  format: ExportFormat,
  quality = 0.92,
  scaleMultiplier = 1
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

      worker.postMessage({
        state,
        format,
        quality,
        scaleMultiplier,
        origin: typeof window !== 'undefined' ? window.location.origin : undefined,
      });
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
  const scale = state.exportScale ?? 2;
  if (format === 'svg') {
    const svg = renderToSvg(state);
    downloadText(svg, exportFilename(format, state.width, state.height, scale), 'image/svg+xml');
    return;
  }

  try {
    const blob = await exportViaWorker(state, format, quality, scale);
    downloadBlob(blob, exportFilename(format, state.width, state.height, scale));
  } catch (err) {
    console.warn('Worker export failed, falling back to main thread:', err);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(state.width * scale);
    canvas.height = Math.round(state.height * scale);
    await renderToCanvas(canvas, state, { scale });
    const blob = await canvasToBlob(
      canvas,
      format === 'png' ? 'png' : format === 'webp' ? 'webp' : 'jpeg',
      quality
    );
    if (blob) {
      downloadBlob(blob, exportFilename(format, state.width, state.height, scale));
    } else {
      throw new Error('Fallback export failed to produce blob');
    }
  }
}

export async function copyImageToClipboard(state: EditorState): Promise<void> {
  let blob: Blob;
  const scale = Math.min(state.exportScale ?? 2, 2);
  try {
    // Clipboard API requires PNG format for image pasting in most browsers
    blob = await exportViaWorker(state, 'png', 1.0, scale);
  } catch (err) {
    console.warn('Worker export for clipboard failed, falling back to main thread:', err);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(state.width * scale);
    canvas.height = Math.round(state.height * scale);
    await renderToCanvas(canvas, state, { scale });
    const p = new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to convert canvas to blob'));
      }, 'image/png');
    });
    blob = await p;
  }
  
  await navigator.clipboard.write([
    new ClipboardItem({
      [blob.type]: blob
    })
  ]);
}




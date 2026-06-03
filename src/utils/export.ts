import type { EditorState, ExportFormat } from '../types';
import { renderToCanvas, canvasToBlob } from '../lib/canvas-renderer';
import { renderToSvg } from '../lib/svg-renderer';
import { downloadBlob, downloadText } from './dom';

export function exportFilename(format: ExportFormat, w: number, h: number): string {
  const ext = format === 'jpeg' ? 'jpg' : format;
  return `typeframe-${w}x${h}.${ext}`;
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

  const canvas = document.createElement('canvas');
  await renderToCanvas(canvas, state, { scale: 1, forExport: true });
  const blob = await canvasToBlob(
    canvas,
    format === 'png' ? 'png' : format === 'webp' ? 'webp' : 'jpeg',
    quality
  );
  if (blob) {
    downloadBlob(blob, exportFilename(format, state.width, state.height));
  }
}

export async function exportViaWorker(
  state: EditorState,
  format: ExportFormat,
  quality = 0.92
): Promise<void> {
  if (format === 'svg') {
    return exportImage(state, format, quality);
  }

  const { default: ExportWorker } = await import('../workers/export.worker?worker');
  const worker = new ExportWorker();
  const offscreen = new OffscreenCanvas(state.width, state.height);

  return new Promise((resolve, reject) => {
    worker.onmessage = (e: MessageEvent<{ blob?: Blob; error?: string }>) => {
      worker.terminate();
      if (e.data.error) reject(new Error(e.data.error));
      else if (e.data.blob) {
        downloadBlob(e.data.blob, exportFilename(format, state.width, state.height));
        resolve();
      }
    };
    worker.postMessage({ state, format, quality }, []);
  });
}

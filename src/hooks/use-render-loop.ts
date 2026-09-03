import type { EditorState } from '../types';
import { renderToCanvas } from '../lib/canvas-renderer';
import { rafThrottle } from './use-debounce';

export function createRenderLoop(
  getCanvas: () => HTMLCanvasElement | null,
  getPreviewScale: () => number,
  onAfterRender?: (state: EditorState, scale: number) => void
): {
  schedule: (state: EditorState) => void;
  destroy: () => void;
} {
  let pending: EditorState | null = null;
  const flush = rafThrottle(async () => {
    if (!pending) return;
    const canvas = getCanvas();
    if (!canvas) return;
    const state = pending;
    const scale = getPreviewScale();
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2.5) : 1;
    try {
      await renderToCanvas(canvas, state, { scale, dpr });
      onAfterRender?.(state, scale);
    } catch (err) {
      console.error('Render error:', err);
    }
  });

  return {
    schedule(state: EditorState) {
      pending = state;
      flush();
    },
    destroy() {
      pending = null;
    },
  };
}

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
  let running = false;

  const flush = rafThrottle(async () => {
    if (!pending) return;
    const canvas = getCanvas();
    if (!canvas) return;
    const state = pending;
    const scale = getPreviewScale();
    running = true;
    try {
      await renderToCanvas(canvas, state, { scale });
      onAfterRender?.(state, scale);
    } finally {
      running = false;
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

/// <reference lib="webworker" />
import type { EditorState, ExportFormat } from '../types';

interface WorkerMessage {
  state: EditorState;
  format: ExportFormat;
  quality?: number;
}

// Inline minimal render for worker (OffscreenCanvas)
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { state, format, quality = 0.92 } = e.data;
  try {
    const canvas = new OffscreenCanvas(state.width, state.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');

    // Simplified background + text for export worker
    ctx.fillStyle = state.background.solidColor ?? '#0f0f12';
    ctx.fillRect(0, 0, state.width, state.height);

    const block = state.blocks[0];
    if (block) {
      ctx.fillStyle = '#f4f4f5';
      ctx.font = `${state.typography.fontWeight} ${state.typography.fontSize}px ${state.typography.fontFamily}`;
      ctx.textAlign = state.typography.textAlign as CanvasTextAlign;
      const x =
        state.typography.textAlign === 'center'
          ? block.x + block.width / 2
          : state.typography.textAlign === 'right'
            ? block.x + block.width
            : block.x;
      block.content.split('\n').forEach((line, i) => {
        ctx.fillText(line, x, block.y + state.typography.fontSize * (1 + i * state.typography.lineHeight));
      });
    }

    const mime =
      format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
    const blob = await canvas.convertToBlob({ type: mime, quality });
    self.postMessage({ blob });
  } catch (err) {
    self.postMessage({ error: String(err) });
  }
};

export default null;

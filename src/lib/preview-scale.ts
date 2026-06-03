/** Max preview footprint in the center panel (CSS pixels). */
export const PREVIEW_MAX_WIDTH = 520;
export const PREVIEW_MAX_HEIGHT = 680;

export function computePreviewScale(
  stage: HTMLElement | null,
  artboardW: number,
  artboardH: number
): number {
  if (!stage || artboardW <= 0 || artboardH <= 0) return 0.35;

  const pad = 56;
  const stageW = stage.clientWidth - pad;
  const stageH = stage.clientHeight - pad;
  const maxW = Math.min(Math.max(stageW, 200), PREVIEW_MAX_WIDTH);
  const maxH = Math.min(Math.max(stageH, 200), PREVIEW_MAX_HEIGHT);

  const scale = Math.min(maxW / artboardW, maxH / artboardH);
  // Never render preview larger than 55% of native — keeps tall stories in view
  return Math.min(scale, 0.55);
}

export function applyPreviewLayout(
  wrapper: HTMLElement,
  canvas: HTMLCanvasElement,
  artboardW: number,
  artboardH: number,
  scale: number
): { displayW: number; displayH: number } {
  const displayW = Math.round(artboardW * scale);
  const displayH = Math.round(artboardH * scale);

  wrapper.style.width = `${displayW}px`;
  wrapper.style.height = `${displayH}px`;
  wrapper.style.flexShrink = '0';

  canvas.style.width = `${displayW}px`;
  canvas.style.height = `${displayH}px`;
  canvas.style.display = 'block';

  return { displayW, displayH };
}

export function formatDimensions(w: number, h: number): string {
  return `${w.toLocaleString()} × ${h.toLocaleString()}`;
}

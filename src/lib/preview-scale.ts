/** Max preview footprint in the center panel (CSS pixels). */
export const PREVIEW_MAX_WIDTH = 520;
export const PREVIEW_MAX_HEIGHT = 680;

export function computePreviewScale(
  stage: HTMLElement | null,
  artboardW: number,
  artboardH: number
): number {
  if (!stage || artboardW <= 0 || artboardH <= 0) return 0.35;

  // Adaptive padding: tighter on mobile to maximize canvas viewport
  const isMobile = stage.clientWidth < 480;
  const pad = isMobile ? 24 : 56;
  const stageW = Math.max(stage.clientWidth - pad, 60);
  const stageH = Math.max(stage.clientHeight - pad, 60);

  // Allow larger preview footprint on spacious desktop screens (> 1100px stage)
  const maxFootprintW = stage.clientWidth > 1100 ? 720 : PREVIEW_MAX_WIDTH;
  const maxFootprintH = stage.clientHeight > 1100 ? 840 : PREVIEW_MAX_HEIGHT;

  const maxW = Math.min(stageW, maxFootprintW);
  const maxH = Math.min(stageH, maxFootprintH);

  const scale = Math.min(maxW / artboardW, maxH / artboardH);
  // Cap preview scale at 0.70 on large displays, 0.55 on standard
  const maxScaleCap = stage.clientWidth > 1200 ? 0.70 : 0.55;
  return Math.min(scale, maxScaleCap);
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

import { describe, it, expect } from 'vitest';
import { computePreviewScale, formatDimensions } from './preview-scale';

describe('preview-scale', () => {
  describe('computePreviewScale', () => {
    it('returns default fallback scale if stage is null or dimensions invalid', () => {
      expect(computePreviewScale(null, 1000, 1000)).toBe(0.35);
      expect(computePreviewScale({} as HTMLElement, 0, 1000)).toBe(0.35);
    });

    it('computes correct preview scale and respects the 0.55 upper limit', () => {
      // Large client stage
      const stage = {
        clientWidth: 1000,
        clientHeight: 1000,
      } as HTMLElement;

      // 1000 - 56 = 944 maxstage width/height.
      // scale = min(520/1080, 680/1080) = min(0.481, 0.629) = 0.481
      // 0.481 is less than 0.55, so returns ~0.481
      const scale = computePreviewScale(stage, 1080, 1080);
      expect(scale).toBeCloseTo(0.481, 2);

      // A very small artboard should hit the upper limit 0.55 constraint
      const scaleLimit = computePreviewScale(stage, 200, 200);
      expect(scaleLimit).toBe(0.55);
    });
  });

  describe('formatDimensions', () => {
    it('formats width and height with localized thousands separators', () => {
      expect(formatDimensions(1080, 1080)).toContain('1,080 × 1,080');
    });
  });
});

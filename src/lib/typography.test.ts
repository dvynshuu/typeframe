import { describe, it, expect } from 'vitest';
import { fontFamilies, fontWeights, defaultTypography } from './typography';

describe('typography constants & standards', () => {
  it('exposes supported font families with fallback stacks', () => {
    expect(fontFamilies.length).toBeGreaterThanOrEqual(7);
    const inter = fontFamilies.find((f) => f.label === 'Inter');
    expect(inter).toBeDefined();
    expect(inter?.value).toContain('system-ui');

    const mono = fontFamilies.find((f) => f.label === 'JetBrains Mono');
    expect(mono).toBeDefined();
    expect(mono?.value).toContain('monospace');
  });

  it('exposes only supported font weights with valid numeric scales', () => {
    expect(fontWeights).toEqual([
      { value: 400, label: 'Regular' },
      { value: 500, label: 'Medium' },
      { value: 600, label: 'Semibold' },
      { value: 700, label: 'Bold' },
    ]);
    // Ensures unsupported synthetic weight 300 is never exposed
    expect(fontWeights.some((w) => w.value === 300)).toBe(false);
  });

  it('provides sensible default typography contract', () => {
    expect(defaultTypography.fontSize).toBe(42);
    expect(defaultTypography.lineHeight).toBe(1.4);
    expect(defaultTypography.fontWeight).toBe(500);
    expect(defaultTypography.textAlign).toBe('center');
  });
});

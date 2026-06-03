export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace('#', '').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return null;
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

export function withAlpha(color: string, alpha: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

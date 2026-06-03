import type { Typography } from '../types';

export const fontFamilies = [
  { value: '"DM Sans", system-ui, sans-serif', label: 'DM Sans' },
  { value: '"Inter", system-ui, sans-serif', label: 'Inter' },
  { value: '"IBM Plex Sans", system-ui, sans-serif', label: 'IBM Plex Sans' },
  { value: '"Source Serif 4", Georgia, serif', label: 'Source Serif' },
  { value: '"Playfair Display", Georgia, serif', label: 'Playfair Display' },
  { value: '"Cormorant Garamond", Georgia, serif', label: 'Cormorant' },
  { value: '"JetBrains Mono", monospace', label: 'JetBrains Mono' },
];

export const fontWeights = [
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semibold' },
  { value: 700, label: 'Bold' },
];

export const defaultTypography: Typography = {
  fontFamily: '"DM Sans", system-ui, sans-serif',
  fontWeight: 500,
  fontSize: 42,
  lineHeight: 1.4,
  letterSpacing: 0,
  textAlign: 'center',
};

export function mergeTypography(
  base: Typography,
  overrides: Partial<Typography>
): Typography {
  return { ...base, ...overrides };
}

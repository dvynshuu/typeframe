import type { EditorState } from '../types';

export interface FontAsset {
  family: string;
  file: string;
  style: 'normal' | 'italic';
  weight: string;
}

/**
 * One self-hosted file per family (variable where the family supports it).
 * Keep this list in sync with the @font-face declarations in BaseLayout.astro.
 */
export const fontAssets: FontAsset[] = [
  { family: 'Inter', file: '/fonts/Inter.woff2', style: 'normal', weight: '100 900' },
  { family: 'Inter', file: '/fonts/Inter-Italic.woff2', style: 'italic', weight: '100 900' },
  { family: 'IBM Plex Sans', file: '/fonts/IBMPlexSans.woff2', style: 'normal', weight: '100 700' },
  { family: 'Source Serif 4', file: '/fonts/SourceSerif4.woff2', style: 'normal', weight: '200 900' },
  {
    family: 'Source Serif 4',
    file: '/fonts/SourceSerif4-Italic.woff2',
    style: 'italic',
    weight: '200 900',
  },
  {
    family: 'Playfair Display',
    file: '/fonts/PlayfairDisplay.woff2',
    style: 'normal',
    weight: '400 900',
  },
  {
    family: 'Playfair Display',
    file: '/fonts/PlayfairDisplay-Italic.woff2',
    style: 'italic',
    weight: '400 900',
  },
  {
    family: 'Cormorant Garamond',
    file: '/fonts/CormorantGaramond.woff2',
    style: 'normal',
    weight: '300 700',
  },
  {
    family: 'Cormorant Garamond',
    file: '/fonts/CormorantGaramond-Italic.woff2',
    style: 'italic',
    weight: '300 700',
  },
  {
    family: 'Instrument Serif',
    file: '/fonts/InstrumentSerif-Regular.woff2',
    style: 'normal',
    weight: '400',
  },
  {
    family: 'Instrument Serif',
    file: '/fonts/InstrumentSerif-Italic.woff2',
    style: 'italic',
    weight: '400',
  },
  { family: 'JetBrains Mono', file: '/fonts/JetBrainsMono.woff2', style: 'normal', weight: '100 800' },
  {
    family: 'JetBrains Mono',
    file: '/fonts/JetBrainsMono-Italic.woff2',
    style: 'italic',
    weight: '100 800',
  },
];

export const knownFontFamilies = [...new Set(fontAssets.map((asset) => asset.family))];

export function primaryFontFamily(stack: string): string {
  return (
    knownFontFamilies.find((family) => stack.includes(`"${family}"`) || stack.includes(family)) ??
    'Inter'
  );
}

export function needsItalic(state: EditorState): boolean {
  if (state.textMode === 'plain') return false;
  return /<i>|<\/?em>|\*[^*\n]+\*/.test(state.text);
}

/** Families that must be present before the canvas or an export can draw accurately. */
export function requiredFontFamilies(state: EditorState): Set<string> {
  const families = new Set<string>(['Inter']);
  families.add(primaryFontFamily(state.typography.fontFamily));

  if (state.showMasthead) families.add('IBM Plex Sans');

  const usesCode =
    state.templateId === 'code-snippet' ||
    state.blocks.some((block) => block.isCode) ||
    state.frameStyle === 'browser';
  if (usesCode) families.add('JetBrains Mono');

  return families;
}

export function fontRequirementKey(state: EditorState): string {
  return `${[...requiredFontFamilies(state)].sort().join('|')}:${needsItalic(state) ? 'italic' : 'upright'}`;
}

export function fontAssetsForState(state: EditorState): FontAsset[] {
  const families = requiredFontFamilies(state);
  const italic = needsItalic(state);
  return fontAssets.filter(
    (asset) => families.has(asset.family) && (asset.style === 'normal' || italic)
  );
}

const loadedDocumentFonts = new Set<string>();

/**
 * Canvas text does not trigger CSS font loading. Explicitly request each
 * family that the current composition needs so the first preview render is
 * measured with the real typeface, not a fallback.
 */
export async function ensureFontsForState(state: EditorState): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;

  const pending = fontAssetsForState(state)
    .map(async (asset) => {
      const key = `${asset.family}:${asset.style}`;
      if (loadedDocumentFonts.has(key)) return;
      const style = asset.style === 'italic' ? 'italic ' : '';
      try {
        await document.fonts.load(`${style}400 16px "${asset.family}"`);
        loadedDocumentFonts.add(key);
      } catch {
        /* Keep the fallback stack if a font is unavailable. */
      }
    });

  await Promise.all(pending);
}

import { describe, it, expect } from 'vitest';
import { computeAutoLayout } from './auto-layout';
import type { EditorState } from '../types';

const mockBaseState: EditorState = {
  text: 'Design is how it works.',
  textMode: 'plain',
  templateId: 'quote-card',
  themeId: 'studio-dark',
  typography: {
    fontFamily: '"Inter", system-ui, sans-serif',
    fontWeight: 500,
    fontSize: 42,
    lineHeight: 1.4,
    letterSpacing: 0,
    textAlign: 'center',
  },
  background: {
    type: 'solid',
    solidColor: '#0f0f12',
  },
  blocks: [],
  width: 1000,
  height: 1000,
  presetSize: 'custom',
  customWidth: 1000,
  customHeight: 1000,
  showMasthead: false,
};

describe('auto-layout', () => {
  describe('computeAutoLayout', () => {
    it('creates centered layout for standard short text', () => {
      const state = { ...mockBaseState, text: 'Hello short text' };
      const blocks = computeAutoLayout(state);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].id).toBe('main');
      expect(blocks[0].isCode).toBeUndefined();
      // Should be centered vertically: (1000 - blockHeight) / 2
      expect(blocks[0].y).toBeGreaterThan(0);
      expect(blocks[0].width).toBe(1000 - (1000 * 0.08 * 2)); // width - padX * 2
    });

    it('creates code layout if state is markdown with backticks', () => {
      const state: EditorState = {
        ...mockBaseState,
        text: '```ts\nconst x = 5;\n```',
        textMode: 'markdown',
      };
      const blocks = computeAutoLayout(state);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].isCode).toBe(true);
      expect(blocks[0].content).toBe('const x = 5;');
    });

    it('creates editorial layout for long text', () => {
      const state = {
        ...mockBaseState,
        templateId: 'linkedin-post' as const,
        text: 'This is a very long text. '.repeat(20), // > 400 chars
      };
      const blocks = computeAutoLayout(state);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].x).toBeCloseTo(80 + (840 * 0.05)); // padX + contentW * 0.05
    });
  });


});

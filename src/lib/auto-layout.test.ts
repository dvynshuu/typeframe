import { describe, it, expect } from 'vitest';
import { computeAutoLayout, applyTemplateLayout } from './auto-layout';
import type { EditorState, Template } from '../types';

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

  describe('applyTemplateLayout', () => {
    it('applies template specifications to editor state', () => {
      const template: Template = {
        id: 'instagram-story',
        name: 'Instagram Story',
        width: 1080,
        height: 1920,
        description: 'Tall layout',
        defaultTypography: {
          fontSize: 48,
          textAlign: 'center',
        },
        layoutHint: 'centered',
      };

      const result = applyTemplateLayout(mockBaseState, template);
      expect(result.width).toBe(1080);
      expect(result.height).toBe(1920);
      expect(result.typography?.fontSize).toBe(48);
      expect(result.blocks).toHaveLength(1);
    });
  });
});

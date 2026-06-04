import { describe, it, expect } from 'vitest';
import { serializeState, deserializeState } from './url-state';
import type { EditorState } from '../types';

const mockBaseState: EditorState = {
  text: 'Hello World',
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
  width: 1080,
  height: 1080,
  presetSize: '1080x1080',
  customWidth: 1080,
  customHeight: 1080,
  showMasthead: false,
};

describe('url-state', () => {
  describe('serializeState & deserializeState', () => {
    it('serializes and deserializes editor state with parity', () => {
      const state: EditorState = {
        ...mockBaseState,
        text: 'Dynamic Quote Text',
        textMode: 'markdown',
        templateId: 'instagram-post',
        themeId: 'kinfolk',
        typography: {
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontWeight: 600,
          fontSize: 36,
          lineHeight: 1.5,
          letterSpacing: 0.05,
          textAlign: 'left',
        },
        background: {
          type: 'solid',
          solidColor: '#ffffff',
        },
        showMasthead: true,
      };

      const queryString = serializeState(state);
      expect(queryString).toContain('text=Dynamic+Quote+Text');
      expect(queryString).toContain('mode=markdown');
      expect(queryString).toContain('temp=instagram-post');
      expect(queryString).toContain('theme=kinfolk');
      expect(queryString).toContain('color=%23ffffff');
      expect(queryString).toContain('masthead=1');

      const restoredState = deserializeState(queryString, mockBaseState);
      expect(restoredState.text).toBe(state.text);
      expect(restoredState.textMode).toBe(state.textMode);
      expect(restoredState.templateId).toBe(state.templateId);
      expect(restoredState.themeId).toBe(state.themeId);
      expect(restoredState.typography.fontSize).toBe(state.typography.fontSize);
      expect(restoredState.typography.textAlign).toBe(state.typography.textAlign);
      expect(restoredState.background.solidColor).toBe(state.background.solidColor);
      expect(restoredState.showMasthead).toBe(true);
    });

    it('returns default state if query parameters are missing', () => {
      const restored = deserializeState('', mockBaseState);
      expect(restored).toEqual(mockBaseState);
    });
  });
});

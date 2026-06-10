import { describe, it, expect } from 'vitest';
import { serializeState, deserializeState } from './url-state';
import type { EditorState } from '../types';

const mockBaseState: EditorState = {
  text: 'Design is not just what it looks like.\nDesign is how it works.',
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
    it('serializes and deserializes editor state with compact query param', () => {
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
          textColor: '#ff0000',
        },
        background: {
          type: 'solid',
          solidColor: '#ffffff',
        },
        showMasthead: true,
      };

      const queryString = serializeState(state);
      expect(queryString).toContain('state=');
      expect(queryString).not.toContain('text=');

      const restoredState = deserializeState(queryString, mockBaseState);
      expect(restoredState.text).toBe(state.text);
      expect(restoredState.textMode).toBe(state.textMode);
      expect(restoredState.templateId).toBe(state.templateId);
      expect(restoredState.themeId).toBe(state.themeId);
      expect(restoredState.typography.fontSize).toBe(state.typography.fontSize);
      expect(restoredState.typography.textAlign).toBe(state.typography.textAlign);
      expect(restoredState.typography.textColor).toBe(state.typography.textColor);
      expect(restoredState.background.solidColor).toBe(state.background.solidColor);
      expect(restoredState.showMasthead).toBe(true);
    });

    it('successfully falls back to deserializing legacy queries', () => {
      const legacyQuery = 'text=Legacy+Text&mode=rich&temp=twitter-post&theme=kinfolk&color=%23ffffff&masthead=1';
      const restored = deserializeState(legacyQuery, mockBaseState);

      expect(restored.text).toBe('Legacy Text');
      expect(restored.textMode).toBe('rich');
      expect(restored.templateId).toBe('twitter-post');
      expect(restored.themeId).toBe('kinfolk');
      expect(restored.background.solidColor).toBe('#ffffff');
      expect(restored.showMasthead).toBe(true);
    });

    it('returns default state if query parameters are missing', () => {
      const restored = deserializeState('', mockBaseState);
      expect(restored).toEqual(mockBaseState);
    });
  });
});


import type { EditorState, TextMode, TemplateId, ThemeId, BackgroundType, TextAlign, PresetSize } from '../types';
import { computeAutoLayout } from '../lib/auto-layout';

export function serializeState(state: EditorState): string {
  const params = new URLSearchParams();
  params.set('text', state.text);
  params.set('mode', state.textMode);
  params.set('temp', state.templateId);
  params.set('theme', state.themeId);
  
  params.set('font', state.typography.fontFamily);
  params.set('weight', String(state.typography.fontWeight));
  params.set('size', String(state.typography.fontSize));
  params.set('lh', String(state.typography.lineHeight));
  params.set('ls', String(state.typography.letterSpacing));
  params.set('align', state.typography.textAlign);
  
  params.set('bg', state.background.type);
  if (state.background.solidColor) {
    params.set('color', state.background.solidColor);
  }
  
  params.set('w', String(state.width));
  params.set('h', String(state.height));
  params.set('preset', state.presetSize);
  
  if (state.blocks[0]) {
    params.set('bx', String(Math.round(state.blocks[0].x)));
    params.set('by', String(Math.round(state.blocks[0].y)));
    params.set('bw', String(Math.round(state.blocks[0].width)));
    params.set('bh', String(Math.round(state.blocks[0].height)));
  }
  
  return params.toString();
}

export function deserializeState(queryString: string, defaultState: EditorState): EditorState {
  const params = new URLSearchParams(queryString);
  if (!params.has('text') && !params.has('theme')) return defaultState;
  
  const text = params.get('text') ?? defaultState.text;
  const textMode = (params.get('mode') as TextMode) ?? defaultState.textMode;
  const templateId = (params.get('temp') as TemplateId) ?? defaultState.templateId;
  const themeId = (params.get('theme') as ThemeId) ?? defaultState.themeId;
  
  const typography = {
    fontFamily: params.get('font') ?? defaultState.typography.fontFamily,
    fontWeight: Number(params.get('weight')) || defaultState.typography.fontWeight,
    fontSize: Number(params.get('size')) || defaultState.typography.fontSize,
    lineHeight: Number(params.get('lh')) || defaultState.typography.lineHeight,
    letterSpacing: Number(params.get('ls')) || defaultState.typography.letterSpacing,
    textAlign: (params.get('align') as TextAlign) ?? defaultState.typography.textAlign,
  };
  
  const bgType = (params.get('bg') as BackgroundType) ?? defaultState.background.type;
  const solidColor = params.get('color') ?? defaultState.background.solidColor;
  
  const width = Number(params.get('w')) || defaultState.width;
  const height = Number(params.get('h')) || defaultState.height;
  const presetSize = (params.get('preset') as PresetSize) ?? defaultState.presetSize;
  
  const background = {
    ...defaultState.background,
    type: bgType,
    solidColor,
  };
  
  const state: EditorState = {
    ...defaultState,
    text,
    textMode,
    templateId,
    themeId,
    typography,
    background,
    width,
    height,
    presetSize,
    customWidth: presetSize === 'custom' ? width : defaultState.customWidth,
    customHeight: presetSize === 'custom' ? height : defaultState.customHeight,
  };
  
  // Re-calculate auto layout first
  state.blocks = computeAutoLayout(state);
  
  // Apply block overrides from URL if they exist
  if (state.blocks[0] && params.has('bx')) {
    state.blocks[0] = {
      ...state.blocks[0],
      x: Number(params.get('bx')) ?? state.blocks[0].x,
      y: Number(params.get('by')) ?? state.blocks[0].y,
      width: Number(params.get('bw')) ?? state.blocks[0].width,
      height: Number(params.get('bh')) ?? state.blocks[0].height,
    };
  }
  
  return state;
}

export function saveStateToLocalStorage(state: EditorState): void {
  try {
    // Exclude blob URL as it is temporary and fails to reload later
    const stateToSave = {
      ...state,
      background: {
        ...state.background,
        imageUrl: undefined,
      },
    };
    localStorage.setItem('typeframe-draft', JSON.stringify(stateToSave));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function loadStateFromLocalStorage(defaultState: EditorState): EditorState {
  try {
    const raw = localStorage.getItem('typeframe-draft');
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<EditorState>;
    return {
      ...defaultState,
      ...parsed,
      typography: {
        ...defaultState.typography,
        ...(parsed.typography ?? {}),
      },
      background: {
        ...defaultState.background,
        ...(parsed.background ?? {}),
      },
      blocks: parsed.blocks ?? defaultState.blocks,
    };
  } catch (err) {
    console.error('Failed to load from localStorage:', err);
    return defaultState;
  }
}

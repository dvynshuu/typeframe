import type { EditorState, TextMode, TemplateId, ThemeId, BackgroundType, TextAlign, PresetSize } from '../types';
import { computeAutoLayout } from '../lib/auto-layout';
import { createInitialState } from '../lib/state';

function base64urlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(base64url: string): string {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const binString = atob(base64);
  const bytes = Uint8Array.from(binString, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function serializeState(state: EditorState): string {
  const defaultState = createInitialState();
  const compact: Record<string, any> = {};

  if (state.text !== defaultState.text) compact.t = state.text;
  if (state.textMode !== defaultState.textMode) compact.m = state.textMode;
  if (state.templateId !== defaultState.templateId) compact.temp = state.templateId;
  if (state.themeId !== defaultState.themeId) compact.theme = state.themeId;

  // Typography
  const ty = state.typography;
  const dty = defaultState.typography;
  if (ty.fontFamily !== dty.fontFamily) compact.font = ty.fontFamily;
  if (ty.fontWeight !== dty.fontWeight) compact.weight = ty.fontWeight;
  if (ty.fontSize !== dty.fontSize) compact.size = ty.fontSize;
  if (ty.lineHeight !== dty.lineHeight) compact.lh = ty.lineHeight;
  if (ty.letterSpacing !== dty.letterSpacing) compact.ls = ty.letterSpacing;
  if (ty.textAlign !== dty.textAlign) compact.align = ty.textAlign;

  // Background
  const bg = state.background;
  const dbg = defaultState.background;
  if (bg.type !== dbg.type) compact.bg = bg.type;
  if (bg.solidColor !== dbg.solidColor) compact.color = bg.solidColor;

  if (state.width !== defaultState.width) compact.w = state.width;
  if (state.height !== defaultState.height) compact.h = state.height;
  if (state.presetSize !== defaultState.presetSize) compact.preset = state.presetSize;
  if (state.showMasthead !== defaultState.showMasthead) compact.masthead = state.showMasthead ? 1 : 0;

  if (state.blocks[0]) {
    compact.bx = Math.round(state.blocks[0].x);
    compact.by = Math.round(state.blocks[0].y);
    compact.bw = Math.round(state.blocks[0].width);
    compact.bh = Math.round(state.blocks[0].height);
  }

  const jsonStr = JSON.stringify(compact);
  const encoded = base64urlEncode(jsonStr);
  return `state=${encoded}`;
}

export function deserializeState(queryString: string, defaultState: EditorState): EditorState {
  const params = new URLSearchParams(queryString);
  if (!params.has('state')) {
    if (!params.has('text') && !params.has('theme')) return defaultState;
    return deserializeLegacyState(params, defaultState);
  }

  try {
    const encoded = params.get('state') || '';
    if (!encoded) return defaultState;
    const jsonStr = base64urlDecode(encoded);
    const compact = JSON.parse(jsonStr);

    const text = compact.t !== undefined ? compact.t : defaultState.text;
    const textMode = compact.m !== undefined ? compact.m : defaultState.textMode;
    const templateId = compact.temp !== undefined ? compact.temp : defaultState.templateId;
    const themeId = compact.theme !== undefined ? compact.theme : defaultState.themeId;

    const typography = {
      fontFamily: compact.font !== undefined ? compact.font : defaultState.typography.fontFamily,
      fontWeight: compact.weight !== undefined ? Number(compact.weight) : defaultState.typography.fontWeight,
      fontSize: compact.size !== undefined ? Number(compact.size) : defaultState.typography.fontSize,
      lineHeight: compact.lh !== undefined ? Number(compact.lh) : defaultState.typography.lineHeight,
      letterSpacing: compact.ls !== undefined ? Number(compact.ls) : defaultState.typography.letterSpacing,
      textAlign: compact.align !== undefined ? compact.align : defaultState.typography.textAlign,
    };

    const bgType = compact.bg !== undefined ? compact.bg : defaultState.background.type;
    const solidColor = compact.color !== undefined ? compact.color : defaultState.background.solidColor;

    const width = compact.w !== undefined ? Number(compact.w) : defaultState.width;
    const height = compact.h !== undefined ? Number(compact.h) : defaultState.height;
    const presetSize = compact.preset !== undefined ? compact.preset : defaultState.presetSize;
    const showMasthead = compact.masthead === 1;

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
      showMasthead,
    };

    state.blocks = computeAutoLayout(state);

    if (state.blocks[0] && compact.bx !== undefined) {
      state.blocks[0] = {
        ...state.blocks[0],
        x: Number(compact.bx) ?? state.blocks[0].x,
        y: Number(compact.by) ?? state.blocks[0].y,
        width: Number(compact.bw) ?? state.blocks[0].width,
        height: Number(compact.bh) ?? state.blocks[0].height,
      };
    }

    return state;
  } catch (err) {
    console.error('Failed to deserialize state from URL:', err);
    return defaultState;
  }
}

function deserializeLegacyState(params: URLSearchParams, defaultState: EditorState): EditorState {
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
  const showMasthead = params.get('masthead') === '1';

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
    showMasthead,
  };

  state.blocks = computeAutoLayout(state);

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
      showMasthead: parsed.showMasthead ?? defaultState.showMasthead,
      blocks: parsed.blocks ?? defaultState.blocks,
    };
  } catch (err) {
    console.error('Failed to load from localStorage:', err);
    return defaultState;
  }
}

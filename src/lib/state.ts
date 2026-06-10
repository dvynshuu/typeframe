import type { EditorState, TemplateId, ThemeId, TextMode, PresetSize } from '../types';
import { defaultTypography } from './typography';
import { getTemplate } from './templates';
import { getTheme } from './themes';
import { computeAutoLayout } from './auto-layout';

const defaultTemplate = getTemplate('quote-card');
const defaultTheme = getTheme('studio-dark');

export function createInitialState(): EditorState {
  const text =
    'Design is not just what it looks like.\nDesign is how it works.';
  const state: EditorState = {
    text,
    textMode: 'plain',
    templateId: 'quote-card',
    themeId: 'studio-dark',
    typography: { ...defaultTypography, ...defaultTemplate.defaultTypography, textColor: defaultTheme.text },
    background: { ...defaultTheme.background },
    blocks: [],
    width: defaultTemplate.width,
    height: defaultTemplate.height,
    presetSize: '1080x1080',
    customWidth: 1080,
    customHeight: 1080,
    showMasthead: false,
  };
  state.blocks = computeAutoLayout(state);
  return state;
}

export type StateListener = (state: EditorState) => void;

export class EditorStore {
  private state: EditorState;
  private listeners = new Set<StateListener>();

  constructor(initial?: EditorState) {
    this.state = initial ?? createInitialState();
  }

  getState(): EditorState {
    return this.state;
  }

  subscribe(fn: StateListener): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  setState(partial: Partial<EditorState>): void {
    this.state = { ...this.state, ...partial };
    if (
      partial.text !== undefined ||
      partial.templateId !== undefined ||
      partial.textMode !== undefined ||
      partial.width !== undefined ||
      partial.height !== undefined
    ) {
      this.state.blocks = computeAutoLayout(this.state);
    }
    this.notify();
  }

  setText(text: string): void {
    this.setState({ text });
  }

  setTextMode(mode: TextMode): void {
    this.setState({ textMode: mode });
  }

  setTemplate(id: TemplateId): void {
    const t = getTemplate(id);
    this.setState({
      templateId: id,
      width: t.width,
      height: t.height,
      typography: { ...this.state.typography, ...t.defaultTypography },
      presetSize: matchPreset(t.width, t.height),
    });
  }

  setTheme(id: ThemeId): void {
    const theme = getTheme(id);
    this.setState({
      themeId: id,
      background: structuredClone(theme.background),
      typography: { ...this.state.typography, ...theme.typography, textColor: theme.text },
    });
  }

  setBlockPosition(id: string, x: number, y: number): void {
    this.state.blocks = this.state.blocks.map((b) =>
      b.id === id ? { ...b, x, y } : b
    );
    this.notify();
  }

  setBlockSize(id: string, width: number, height: number): void {
    this.state.blocks = this.state.blocks.map((b) =>
      b.id === id ? { ...b, width, height } : b
    );
    this.notify();
  }

  private notify(): void {
    const s = this.state;
    this.listeners.forEach((fn) => fn(s));
  }
}

function matchPreset(w: number, h: number): PresetSize {
  if (w === 1080 && h === 1080) return '1080x1080';
  if (w === 1080 && h === 1350) return '1080x1350';
  if (w === 1080 && h === 1920) return '1080x1920';
  if (w === 1920 && h === 1080) return '1920x1080';
  return 'custom';
}

export type TextMode = 'plain' | 'rich' | 'markdown';

export type TemplateId =
  | 'quote-card'
  | 'twitter-post'
  | 'instagram-story'
  | 'instagram-post'
  | 'linkedin-post'
  | 'study-notes'
  | 'announcement'
  | 'blog-snippet'
  | 'code-snippet';

export type ThemeId =
  | 'studio-dark'
  | 'economist'
  | 'kinfolk'
  | 'apple-notes'
  | 'japanese-editorial'
  | 'architectural-digest'
  | 'braun-studio'
  | 'bauhaus';

export type BackgroundType =
  | 'solid'
  | 'gradient'
  | 'mesh'
  | 'glass'
  | 'noise'
  | 'image';

export type ExportFormat = 'png' | 'jpeg' | 'svg' | 'webp';

export type PresetSize =
  | '1080x1080'
  | '1080x1350'
  | '1080x1920'
  | '1920x1080'
  | 'custom';

export type TextAlign = 'left' | 'center' | 'right';

export interface Typography {
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  textAlign: TextAlign;
}

export interface GradientStop {
  color: string;
  position: number;
}

export interface BackgroundConfig {
  type: BackgroundType;
  solidColor?: string;
  gradientStops?: GradientStop[];
  gradientAngle?: number;
  meshColors?: string[];
  imageUrl?: string;
  imageOpacity?: number;
  noiseIntensity?: number;
  glassBlur?: number;
  imageSizeMode?: 'cover' | 'contain' | 'stretch' | 'original';
  imageScale?: number;
}

export interface TextBlock {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isCode?: boolean;
}

export type ThemeDecoration =
  | 'vignette'
  | 'grain'
  | 'scanlines'
  | 'grid'
  | 'frame'
  | 'masthead'
  | 'glow-orb'
  | 'column-rule'
  | 'accent-rule'
  | 'bezel'
  | 'economist-header'
  | 'vertical-grid'
  | 'double-frame'
  | 'braun-grid'
  | 'braun-dials'
  | 'bauhaus-shapes';

export interface Theme {
  id: ThemeId;
  name: string;
  tagline: string;
  swatch: string;
  background: BackgroundConfig;
  typography: Partial<Typography>;
  accent: string;
  text: string;
  muted: string;
  decorations?: ThemeDecoration[];
}

export interface Template {
  id: TemplateId;
  name: string;
  width: number;
  height: number;
  description: string;
  defaultTypography: Partial<Typography>;
  layoutHint: 'centered' | 'editorial' | 'code' | 'social';
}

export interface EditorState {
  text: string;
  textMode: TextMode;
  templateId: TemplateId;
  themeId: ThemeId;
  typography: Typography;
  background: BackgroundConfig;
  blocks: TextBlock[];
  width: number;
  height: number;
  presetSize: PresetSize;
  customWidth: number;
  customHeight: number;
  showMasthead?: boolean;
}

export interface RenderOptions {
  scale?: number;
  forExport?: boolean;
}

export interface ExportRequest {
  format: ExportFormat;
  width: number;
  height: number;
  quality?: number;
  state: EditorState;
}

export interface ExportResult {
  blob?: Blob;
  svg?: string;
  filename: string;
}

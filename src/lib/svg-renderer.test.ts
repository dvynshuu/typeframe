import { describe, it, expect } from 'vitest';
import { renderToSvg } from './svg-renderer';
import type { EditorState } from '../types';

const mockState: EditorState = {
  text: 'This is a very long line that should wrap on multiple lines inside the SVG output.',
  textMode: 'plain',
  templateId: 'quote-card',
  themeId: 'studio-dark',
  typography: {
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: 42,
    lineHeight: 1.4,
    letterSpacing: 0.05,
    textAlign: 'center',
  },
  background: {
    type: 'mesh',
    meshColors: ['#0b0d13', '#161a24', '#6e8cff', '#c37cff'],
    noiseIntensity: 0.04,
  },
  blocks: [
    {
      id: 'main',
      content: 'This is a very long line that should wrap on multiple lines inside the SVG output.',
      x: 80,
      y: 300,
      width: 400,
      height: 300,
    },
  ],
  width: 1000,
  height: 1000,
  presetSize: '1080x1080',
  customWidth: 1000,
  customHeight: 1000,
  showMasthead: true,
};

describe('svg-renderer', () => {
  it('should render a valid SVG string with mesh background and theme decorations', () => {
    const svg = renderToSvg(mockState);
    expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(svg).toContain('<svg');
    expect(svg).toContain('width="1000"');
    expect(svg).toContain('height="1000"');
    expect(svg).toContain('vignette-grad');
    expect(svg).toContain('glow-orb-grad');
    expect(svg).toContain('mesh-blob-0');
    expect(svg).toContain('gradientUnits="userSpaceOnUse"');
  });

  it('should wrap long text lines into multiple tspans', () => {
    const svg = renderToSvg(mockState);
    const tspanCount = (svg.match(/<tspan/g) || []).length;
    // The line is long and width is 400, so it should wrap into at least 2 tspans
    expect(tspanCount).toBeGreaterThan(1);
    expect(svg).toContain('letter-spacing="0.05em"');
  });

  it('should match the visual structural snapshot of the rendered SVG', () => {
    const svg = renderToSvg(mockState);
    expect(svg).toMatchSnapshot();
  });

  it('should render macOS window frame chrome with traffic light buttons in SVG', () => {
    const state: EditorState = {
      ...mockState,
      frameStyle: 'macos',
      cardShadow: 'float',
      cardPadding: 60,
      cardRadius: 16,
    };
    const svg = renderToSvg(state);
    expect(svg).toContain('class="studio-card-frame"');
    expect(svg).toContain('typeframe.studio');
    expect(svg).toContain('fill="#ff5f56"'); // Red close dot
    expect(svg).toContain('fill="#ffbd2e"'); // Yellow minimize dot
    expect(svg).toContain('fill="#27c93f"'); // Green zoom dot
    expect(svg).toContain('frame-shadow-float');
  });

  it('should render browser frame chrome with address bar in SVG', () => {
    const state: EditorState = {
      ...mockState,
      frameStyle: 'browser',
      cardShadow: 'subtle',
    };
    const svg = renderToSvg(state);
    expect(svg).toContain('https://typeframe.io');
    expect(svg).toContain('frame-shadow-subtle');
  });

  it('should render tweet chrome and verified badge in SVG', () => {
    const state: EditorState = {
      ...mockState,
      frameStyle: 'tweet',
      author: {
        name: 'Sarah Connor',
        handle: '@sconnor',
        verified: true,
        showSignature: false,
      },
    };
    const svg = renderToSvg(state);
    expect(svg).toContain('Sarah Connor');
    expect(svg).toContain('@sconnor');
    expect(svg).toContain('fill="#1d9bf0"'); // Verified blue checkmark
  });

  it('should render editorial chrome with corner crosshairs and archive edition text in SVG', () => {
    const state: EditorState = {
      ...mockState,
      frameStyle: 'editorial',
    };
    const svg = renderToSvg(state);
    expect(svg).toContain('TYPEFRAME ARCHIVE • EDITORIAL EDITION');
    expect(svg).toContain('REF. // 004-TF');
  });

  it('should render floating author signature pill in SVG when enabled', () => {
    const state: EditorState = {
      ...mockState,
      frameStyle: 'none',
      author: {
        name: 'Alex Rivera',
        handle: '@arivera',
        verified: true,
        showSignature: true,
      },
    };
    const svg = renderToSvg(state);
    expect(svg).toContain('class="author-signature"');
    expect(svg).toContain('Alex Rivera');
    expect(svg).toContain('@arivera');
    expect(svg).toContain('fill="#1d9bf0"');
  });
});

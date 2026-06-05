import { describe, it, expect } from 'vitest';
import { renderToSvg } from './svg-renderer';
import type { EditorState } from '../types';

const mockState: EditorState = {
  text: 'This is a very long line that should wrap on multiple lines inside the SVG output.',
  textMode: 'plain',
  templateId: 'quote-card',
  themeId: 'midnight',
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
});

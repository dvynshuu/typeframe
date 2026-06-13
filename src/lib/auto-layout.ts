import type { EditorState, TextBlock } from '../types';
import { parseText, isCodeContent } from '../utils/text-parser';
import { getTemplate } from './templates';

const PADDING = 0.08;

export function computeAutoLayout(state: EditorState): TextBlock[] {
  const template = getTemplate(state.templateId);
  const { width, height, text, textMode, typography } = state;
  const padX = width * PADDING;
  const padY = height * PADDING;
  const contentW = width - padX * 2;
  const contentH = height - padY * 2;

  const isCode =
    template.layoutHint === 'code' || isCodeContent(text, textMode);
  const isShort = text.trim().length < 120 && text.split('\n').length <= 3;
  const isLong = text.length > 400 || text.split('\n').length > 8;

  if (isCode) {
    return [
      {
        id: 'main',
        content: text.replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim(),
        x: padX,
        y: padY + height * 0.06,
        width: contentW,
        height: contentH * 0.85,
        isCode: true,
      },
    ];
  }

  if (template.layoutHint === 'centered' || (isShort && !isLong)) {
    const blockH = Math.min(contentH * 0.7, estimateHeight(text, typography.fontSize));
    return [
      {
        id: 'main',
        content: text,
        x: padX,
        y: (height - blockH) / 2,
        width: contentW,
        height: blockH,
      },
    ];
  }

  if (template.layoutHint === 'editorial' || isLong) {
    const blockH = contentH * 0.88;
    return [
      {
        id: 'main',
        content: text,
        x: padX + contentW * 0.05,
        y: padY + height * 0.12,
        width: contentW * 0.9,
        height: blockH,
      },
    ];
  }

  // social default
  return [
    {
      id: 'main',
      content: text,
      x: padX,
      y: padY + height * 0.15,
      width: contentW,
      height: contentH * 0.7,
    },
  ];
}

function estimateHeight(text: string, fontSize: number): number {
  const lines = text.split('\n').length;
  return lines * fontSize * 1.4 + fontSize * 2;
}



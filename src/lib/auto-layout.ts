import type { EditorState, TextBlock } from '../types';
import { isCodeContent } from '../utils/text-parser';
import { getTemplate } from './templates';

const PADDING = 0.08;

export function computeAutoLayout(state: EditorState): TextBlock[] {
  const template = getTemplate(state.templateId);
  const { width, height, text, textMode, typography } = state;
  const hasFrame = Boolean(state.frameStyle && state.frameStyle !== 'none');

  let padX: number;
  let padY: number;
  let contentW: number;
  let contentH: number;

  if (hasFrame) {
    const cardInset = state.cardPadding ?? 56;
    const cardW = Math.max(100, width - cardInset * 2);
    const cardH = Math.max(100, height - cardInset * 2);

    let frameHeaderH = 0;
    let frameFooterH = 0;
    const innerPadX = Math.round(cardW * 0.06);
    const innerPadY = Math.round(cardH * 0.04);

    if (state.frameStyle === 'macos') {
      frameHeaderH = 46;
    } else if (state.frameStyle === 'browser') {
      frameHeaderH = 50;
    } else if (state.frameStyle === 'tweet') {
      frameHeaderH = 76;
    } else if (state.frameStyle === 'editorial') {
      frameHeaderH = 44;
      frameFooterH = 44;
    }

    padX = cardInset + innerPadX;
    padY = cardInset + frameHeaderH + innerPadY;
    contentW = Math.max(80, cardW - innerPadX * 2);
    contentH = Math.max(80, cardH - frameHeaderH - frameFooterH - innerPadY * 2);
  } else {
    padX = width * PADDING;
    padY = height * PADDING;
    contentW = width - padX * 2;
    contentH = height - padY * 2;
  }

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
        y: padY + (hasFrame ? 10 : height * 0.06),
        width: contentW,
        height: contentH * 0.88,
        isCode: true,
      },
    ];
  }

  if (template.layoutHint === 'centered' || (isShort && !isLong)) {
    const estH = estimateHeight(text, typography.fontSize);
    const blockH = Math.min(contentH * (hasFrame ? 0.85 : 0.7), estH);
    const startY = hasFrame
      ? padY + Math.max(0, (contentH - blockH) / 2)
      : (height - blockH) / 2;

    return [
      {
        id: 'main',
        content: text,
        x: padX,
        y: startY,
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
        y: padY + (hasFrame ? 8 : height * 0.12),
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
      y: padY + (hasFrame ? 12 : height * 0.15),
      width: contentW,
      height: contentH * 0.7,
    },
  ];
}

function estimateHeight(text: string, fontSize: number): number {
  const lines = text.split('\n').length;
  return lines * fontSize * 1.4 + fontSize * 2;
}



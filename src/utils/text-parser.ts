import type { TextMode } from '../types';

export interface StyledSpan {
  text: string;
  bold?: boolean;
  italic?: boolean;
  color?: string;
}

export interface ParsedLine {
  text: string;
  spans?: StyledSpan[];
  bold?: boolean;
  italic?: boolean;
  heading?: boolean;
  code?: boolean;
  list?: boolean;
}

export function parseSpans(line: string, mode: TextMode): StyledSpan[] {
  if (mode === 'plain') {
    return [{ text: line }];
  }

  let processed = line;
  if (mode === 'markdown') {
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    processed = processed.replace(/\*(.*?)\*/g, '<i>$1</i>');
    processed = processed.replace(/`(.*?)`/g, '<code>$1</code>');
  }

  const spans: StyledSpan[] = [];
  const tagRegex = /(<\/?[a-zA-Z0-9]+(?:\s+[^>]+)?>)/g;
  const parts = processed.split(tagRegex);

  let isBold = false;
  let isItalic = false;
  const colorStack: string[] = [];

  for (const part of parts) {
    if (part.startsWith('<') && part.endsWith('>')) {
      const tagLower = part.toLowerCase();
      if (tagLower === '<b>' || tagLower === '<strong>') {
        isBold = true;
      } else if (tagLower === '</b>' || tagLower === '</strong>') {
        isBold = false;
      } else if (tagLower === '<i>' || tagLower === '<em>') {
        isItalic = true;
      } else if (tagLower === '</i>' || tagLower === '</em>') {
        isItalic = false;
      } else if (tagLower.startsWith('<span') && tagLower.includes('color')) {
        const colorMatch = part.match(/color\s*:\s*(#[a-fA-F0-9]{3,8}|[a-zA-Z]+)/i);
        if (colorMatch) {
          colorStack.push(colorMatch[1]);
        }
      } else if (tagLower === '</span>') {
        colorStack.pop();
      }
    } else if (part.length > 0) {
      spans.push({
        text: part,
        bold: isBold || undefined,
        italic: isItalic || undefined,
        color: colorStack[colorStack.length - 1] || undefined,
      });
    }
  }

  return spans.length ? spans : [{ text: '' }];
}

export function parseText(text: string, mode: TextMode): ParsedLine[] {
  const lines = text.split('\n').filter((l, i, arr) => l.length > 0 || i < arr.length);

  if (mode === 'plain') {
    return lines.map((line) => ({
      text: line,
      spans: [{ text: line }]
    }));
  }

  if (mode === 'markdown') {
    return lines.map((line) => {
      let content = line;
      let heading = false;
      let list = false;
      let code = false;

      if (line.startsWith('### ')) {
        content = line.slice(4);
        heading = true;
      } else if (line.startsWith('## ')) {
        content = line.slice(3);
        heading = true;
      } else if (line.startsWith('# ')) {
        content = line.slice(2);
        heading = true;
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        content = line.slice(2);
        list = true;
      } else if (line.startsWith('```') || line.match(/^`{3}/)) {
        content = line.replace(/`/g, '');
        code = true;
      }

      const spans = parseSpans(content, mode);
      const bold = spans.some((s) => s.bold);
      const italic = spans.some((s) => s.italic);

      let cleanText = content;
      cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '$1');
      cleanText = cleanText.replace(/\*(.*?)\*/g, '$1');
      cleanText = cleanText.replace(/`(.*?)`/g, '$1');

      return {
        text: cleanText,
        spans,
        heading,
        list,
        code,
        bold: !!bold,
        italic: !!italic,
      };
    });
  }

  return lines.map((line) => {
    const spans = parseSpans(line, mode);
    const bold = spans.some((s) => s.bold);
    const italic = spans.some((s) => s.italic);
    return {
      text: stripForPreview(line),
      spans,
      bold: !!bold,
      italic: !!italic,
    };
  });
}

export function stripForPreview(html: string): string {
  return html.replace(/<[^>]+>/g, '');
}

export function isCodeContent(text: string, mode: TextMode): boolean {
  if (mode === 'markdown') {
    return text.includes('```') || /^`[^`]+`$/m.test(text);
  }
  return false;
}

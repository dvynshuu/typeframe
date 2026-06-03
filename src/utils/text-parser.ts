import type { TextMode } from '../types';

export interface ParsedLine {
  text: string;
  bold?: boolean;
  italic?: boolean;
  heading?: boolean;
  code?: boolean;
  list?: boolean;
}

export function parseText(text: string, mode: TextMode): ParsedLine[] {
  const lines = text.split('\n').filter((l, i, arr) => l.length > 0 || i < arr.length);

  if (mode === 'plain') {
    return lines.map((line) => ({ text: line }));
  }

  if (mode === 'markdown') {
    return lines.map((line) => {
      if (line.startsWith('### ')) return { text: line.slice(4), heading: true };
      if (line.startsWith('## ')) return { text: line.slice(3), heading: true };
      if (line.startsWith('# ')) return { text: line.slice(2), heading: true };
      if (line.startsWith('- ') || line.startsWith('* '))
        return { text: line.slice(2), list: true };
      if (line.startsWith('```') || line.match(/^`{3}/))
        return { text: line.replace(/`/g, ''), code: true };
      const codeInline = line.match(/^`(.+)`$/);
      if (codeInline) return { text: codeInline[1], code: true };
      const bold = line.replace(/\*\*(.+?)\*\*/g, '$1');
      const hasBold = /\*\*(.+?)\*\*/.test(line);
      const italic = line.replace(/\*(.+?)\*/g, '$1');
      const hasItalic = /\*(.+?)\*/.test(line) && !hasBold;
      return {
        text: bold !== line ? bold : italic !== line ? italic : line,
        bold: hasBold,
        italic: hasItalic,
      };
    });
  }

  // rich: strip basic HTML tags for canvas rendering
  return lines.map((line) => {
    const stripped = line
      .replace(/<strong>(.*?)<\/strong>/gi, '$1')
      .replace(/<b>(.*?)<\/b>/gi, '$1')
      .replace(/<em>(.*?)<\/em>/gi, '$1')
      .replace(/<i>(.*?)<\/i>/gi, '$1')
      .replace(/<[^>]+>/g, '');
    const bold = /<strong>|<b>/i.test(line);
    const italic = /<em>|<i>/i.test(line);
    return { text: stripped, bold, italic };
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

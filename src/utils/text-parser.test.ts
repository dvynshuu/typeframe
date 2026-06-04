import { describe, it, expect } from 'vitest';
import { parseText, stripForPreview, isCodeContent } from './text-parser';

describe('text-parser', () => {
  describe('parseText', () => {
    it('parses plain text correctly', () => {
      const text = 'Hello World\nLine two';
      const result = parseText(text, 'plain');
      expect(result).toEqual([
        { text: 'Hello World' },
        { text: 'Line two' },
      ]);
    });

    it('parses markdown formatting correctly', () => {
      // Bold
      expect(parseText('**bold text**', 'markdown')).toEqual([
        { text: 'bold text', bold: true, italic: false },
      ]);

      // Italic
      expect(parseText('*italic text*', 'markdown')).toEqual([
        { text: 'italic text', bold: false, italic: true },
      ]);

      // Headings
      expect(parseText('# Heading 1', 'markdown')).toEqual([
        { text: 'Heading 1', heading: true },
      ]);
      expect(parseText('## Heading 2', 'markdown')).toEqual([
        { text: 'Heading 2', heading: true },
      ]);
      expect(parseText('### Heading 3', 'markdown')).toEqual([
        { text: 'Heading 3', heading: true },
      ]);

      // Code blocks and inline code
      expect(parseText('```ts\nconst x = 5;\n```', 'markdown')).toEqual([
        { text: 'ts', code: true },
        { text: 'const x = 5;', bold: false, italic: false },
        { text: '', code: true },
      ]);
      expect(parseText('`inline code`', 'markdown')).toEqual([
        { text: 'inline code', code: true },
      ]);

      // Lists
      expect(parseText('- Item 1', 'markdown')).toEqual([
        { text: 'Item 1', list: true },
      ]);
      expect(parseText('* Item 2', 'markdown')).toEqual([
        { text: 'Item 2', list: true },
      ]);
    });

    it('parses rich/HTML text correctly', () => {
      expect(parseText('<strong>bold HTML</strong>', 'rich')).toEqual([
        { text: 'bold HTML', bold: true, italic: false },
      ]);

      expect(parseText('<i>italic HTML</i>', 'rich')).toEqual([
        { text: 'italic HTML', bold: false, italic: true },
      ]);

      expect(parseText('<p>HTML paragraph with <b>bold</b> and <em>italic</em></p>', 'rich')).toEqual([
        { text: 'HTML paragraph with bold and italic', bold: true, italic: true },
      ]);
    });
  });

  describe('stripForPreview', () => {
    it('strips HTML tags', () => {
      expect(stripForPreview('<div>Hello <span>World</span></div>')).toBe('Hello World');
    });
  });

  describe('isCodeContent', () => {
    it('identifies markdown code blocks', () => {
      expect(isCodeContent('```javascript\nconst a = 1;\n```', 'markdown')).toBe(true);
      expect(isCodeContent('`inline`', 'markdown')).toBe(true);
      expect(isCodeContent('normal text', 'markdown')).toBe(false);
      expect(isCodeContent('```javascript\nconst a = 1;\n```', 'plain')).toBe(false);
    });
  });
});

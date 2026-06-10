import { describe, it, expect } from 'vitest';
import { parseText, stripForPreview, isCodeContent } from './text-parser';

describe('text-parser', () => {
  describe('parseText', () => {
    it('parses plain text correctly', () => {
      const text = 'Hello World\nLine two';
      const result = parseText(text, 'plain');
      expect(result).toEqual([
        { text: 'Hello World', spans: [{ text: 'Hello World' }] },
        { text: 'Line two', spans: [{ text: 'Line two' }] },
      ]);
    });

    it('parses markdown formatting correctly', () => {
      // Bold
      expect(parseText('**bold text**', 'markdown')).toEqual([
        {
          text: 'bold text',
          bold: true,
          italic: false,
          heading: false,
          list: false,
          code: false,
          spans: [{ text: 'bold text', bold: true, italic: undefined, color: undefined }],
        },
      ]);

      // Italic
      expect(parseText('*italic text*', 'markdown')).toEqual([
        {
          text: 'italic text',
          bold: false,
          italic: true,
          heading: false,
          list: false,
          code: false,
          spans: [{ text: 'italic text', bold: undefined, italic: true, color: undefined }],
        },
      ]);

      // Headings
      expect(parseText('# Heading 1', 'markdown')).toEqual([
        {
          text: 'Heading 1',
          heading: true,
          bold: false,
          italic: false,
          list: false,
          code: false,
          spans: [{ text: 'Heading 1' }],
        },
      ]);

      // Code blocks and inline code
      expect(parseText('```ts\nconst x = 5;\n```', 'markdown')).toEqual([
        {
          text: 'ts',
          code: true,
          bold: false,
          italic: false,
          heading: false,
          list: false,
          spans: [{ text: 'ts' }],
        },
        {
          text: 'const x = 5;',
          code: false,
          bold: false,
          italic: false,
          heading: false,
          list: false,
          spans: [{ text: 'const x = 5;' }],
        },
        {
          text: '',
          code: true,
          bold: false,
          italic: false,
          heading: false,
          list: false,
          spans: [{ text: '' }],
        },
      ]);
      expect(parseText('`inline code`', 'markdown')).toEqual([
        {
          text: 'inline code',
          bold: false,
          italic: false,
          heading: false,
          list: false,
          code: false,
          spans: [{ text: 'inline code', bold: undefined, italic: undefined, color: undefined }],
        },
      ]);

      // Lists
      expect(parseText('- Item 1', 'markdown')).toEqual([
        {
          text: 'Item 1',
          list: true,
          bold: false,
          italic: false,
          heading: false,
          code: false,
          spans: [{ text: 'Item 1' }],
        },
      ]);
    });

    it('parses rich/HTML text correctly', () => {
      expect(parseText('<strong>bold HTML</strong>', 'rich')).toEqual([
        {
          text: 'bold HTML',
          bold: true,
          italic: false,
          spans: [{ text: 'bold HTML', bold: true, italic: undefined, color: undefined }],
        },
      ]);

      expect(parseText('<i>italic HTML</i>', 'rich')).toEqual([
        {
          text: 'italic HTML',
          bold: false,
          italic: true,
          spans: [{ text: 'italic HTML', bold: undefined, italic: true, color: undefined }],
        },
      ]);

      expect(parseText('<p>HTML paragraph with <b>bold</b> and <em>italic</em></p>', 'rich')).toEqual([
        {
          text: 'HTML paragraph with bold and italic',
          bold: true,
          italic: true,
          spans: [
            { text: 'HTML paragraph with ', bold: undefined, italic: undefined, color: undefined },
            { text: 'bold', bold: true, italic: undefined, color: undefined },
            { text: ' and ', bold: undefined, italic: undefined, color: undefined },
            { text: 'italic', bold: undefined, italic: true, color: undefined },
          ],
        },
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

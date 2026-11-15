import type { TemplateId, ThemeId, TextMode } from '../types';

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ToolConfig {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  category: string;
  headline: string;
  summary: string;
  templateId: TemplateId;
  themeId: ThemeId;
  textMode: TextMode;
  defaultText: string;
  highlightFeatures: string[];
  faqs: ToolFaq[];
}

export const toolsData: ToolConfig[] = [
  {
    slug: 'quote-card-maker',
    metaTitle: 'Quote Card Maker — Typeframe',
    metaDescription:
      'Turn quotes into sharp editorial images. Choose type, surface, and ratio, then export PNG, WebP, JPEG, or SVG. Free, private, and watermark-free.',
    h1: 'Online Quote Card Maker',
    category: 'Quotes',
    headline: 'A quote, set properly.',
    summary:
      'Set a quote in real type, give it a surface, and export a finished image in under a minute.',
    templateId: 'quote-card',
    themeId: 'kinfolk',
    textMode: 'plain',
    defaultText: '“Simplicity is the ultimate sophistication.”\n— Leonardo da Vinci',
    highlightFeatures: [
      'Square, portrait, and story presets with a live artboard',
      'Seven typefaces, including Instrument Serif and Cormorant Garamond',
      'Solid, gradient, mesh, glass, grain, and photo surfaces',
      'PNG, WebP, JPEG, and SVG export at up to 4× resolution',
    ],
    faqs: [
      {
        question: 'Is Typeframe free to use?',
        answer:
          'Yes. Typeframe is free to use, requires no account, and adds no watermark to exports.',
      },
      {
        question: 'Which image formats can I export?',
        answer:
          'PNG, JPEG, WebP, and SVG. Raster exports can be rendered at 1×, 2×, or 4× the canvas size.',
      },
      {
        question: 'Can I copy a quote card to my clipboard?',
        answer:
          'Yes. The copy button places a PNG of the current artboard on your clipboard in browsers that support the Clipboard API.',
      },
      {
        question: 'Are my quotes and photos kept private?',
        answer:
          'Text, settings, and uploaded photos stay in your browser. Typeframe renders with the Canvas API on your device and does not upload your work.',
      },
    ],
  },
  {
    slug: 'code-to-image',
    metaTitle: 'Code Snippet to Image — Typeframe',
    metaDescription:
      'Render code snippets as clean, shareable cards with JetBrains Mono, custom padding, and PNG, WebP, JPEG, or SVG export. Runs entirely in your browser.',
    h1: 'Code Snippet to Image',
    category: 'Code',
    headline: 'Code worth showing.',
    summary:
      'A quiet code card for release notes, documentation, and developer posts. No repository connection, no account, no upload.',
    templateId: 'code-snippet',
    themeId: 'studio-dark',
    textMode: 'markdown',
    defaultText:
      '```typescript\n// Typeframe: type, surface, export\ninterface CreatorCard {\n  typography: "editorial";\n  rendering: "client-side canvas";\n  privacy: "local only";\n}\n```',
    highlightFeatures: [
      'Monospaced code cards set in JetBrains Mono',
      'Markdown fences and line-by-line code colouring',
      'Drag the text block to tune its bounds and padding',
      'Raster or vector export, generated on your device',
    ],
    faqs: [
      {
        question: 'How is this different from Carbon or Ray.so?',
        answer:
          'Typeframe is a small, account-free studio that handles code cards as well as quotes and notes. It does not connect to a repository or execute your code.',
      },
      {
        question: 'Can I export a code card as SVG?',
        answer:
          'Yes. SVG export is available and preserves the card as scalable vector shapes and text.',
      },
      {
        question: 'Does Typeframe parse syntax?',
        answer:
          'It colours code line by line rather than parsing a language grammar, so it works best for short, readable snippets.',
      },
      {
        question: 'Is my code uploaded anywhere?',
        answer:
          'No. The snippet is rendered locally and never sent to a server.',
      },
    ],
  },
  {
    slug: 'apple-notes-quote-generator',
    metaTitle: 'Apple Notes Style Quote Generator — Typeframe',
    metaDescription:
      'Make Apple Notes–style cards with warm paper, quiet type, and clean spacing. Export in seconds. Free, private, and watermark-free.',
    h1: 'Apple Notes Quote Generator',
    category: 'Notes',
    headline: 'Note paper, reconsidered.',
    summary:
      'An original interpretation of plain note paper: warm stock, simple type, and enough space to let a thought breathe.',
    templateId: 'study-notes',
    themeId: 'apple-notes',
    textMode: 'plain',
    defaultText:
      'Things I learned this year:\n\n1. Consistency beats intensity.\n2. Clarity is a design decision.\n3. Keep the tools fast and the work private.',
    highlightFeatures: [
      'Warm paper surface with a restrained accent rule',
      'Comfortable leading and quiet sans-serif type',
      '4:5 feed and 9:16 story ratios',
      'Copy the finished image straight to your clipboard',
    ],
    faqs: [
      {
        question: 'Is this affiliated with Apple?',
        answer:
          'No. Typeframe is an independent tool. The notes style is an original interpretation of plain note paper, not an Apple product.',
      },
      {
        question: 'Can I customise the text and type?',
        answer:
          'Yes. Font family, weight, size, leading, tracking, alignment, and colour are all editable in the Refine panel.',
      },
      {
        question: 'Is it free to use?',
        answer:
          'Yes. There is no account, no export limit, and no watermark.',
      },
    ],
  },
  {
    slug: 'tweet-to-image',
    metaTitle: 'Post to Image Converter — Typeframe',
    metaDescription:
      'Turn short posts and thoughts into sharp social images sized for X and LinkedIn. Export high-resolution PNG, WebP, JPEG, or SVG.',
    h1: 'Post to Image Converter',
    category: 'Social',
    headline: 'Built for the timeline.',
    summary:
      'Turn a short post into a composed image that holds its shape in a timeline. Choose the ratio, set the type, and export.',
    templateId: 'twitter-post',
    themeId: 'studio-dark',
    textMode: 'plain',
    defaultText: 'The best tools don’t feel like work.\nThey feel like play with useful outputs.',
    highlightFeatures: [
      '16:9 and 1:1 ratios for timelines and feeds',
      'Editorial serif or clean sans pairings',
      'Optional author attribution with a verified mark',
      'High-resolution PNG with crisp type edges',
    ],
    faqs: [
      {
        question: 'Do I need to connect a social account?',
        answer:
          'No. Typeframe does not connect to X, LinkedIn, or any other network. You paste or type the text, then export an image.',
      },
      {
        question: 'Which ratio should I use?',
        answer:
          '16:9 (1200 × 675) suits landscape timeline images. 1:1 (1080 × 1080) is safer when the same card will be cross-posted.',
      },
      {
        question: 'Can I add an author name and handle?',
        answer:
          'Yes. The Studio frame section includes a post-style frame with editable name, handle, and verification badge.',
      },
      {
        question: 'Does the Share button post the image?',
        answer:
          'No. Share copies a link that reopens the design. To publish the image itself, export or copy it first.',
      },
    ],
  },
  {
    slug: 'markdown-to-image',
    metaTitle: 'Markdown to Image Converter — Typeframe',
    metaDescription:
      'Turn Markdown notes, lists, and headings into clean editorial images for blogs, Notion, Obsidian, and social feeds.',
    h1: 'Markdown to Image Converter',
    category: 'Markdown',
    headline: 'Structure, carried over.',
    summary:
      'Paste Markdown and get a composed card with real hierarchy — useful when a note needs to leave the text editor.',
    templateId: 'blog-snippet',
    themeId: 'economist',
    textMode: 'markdown',
    defaultText:
      '# The Creative Process\n\n**Ideas** are cheap. *Execution* is everything.\n\n- Write daily with strict focus\n- Cut fluff and noise\n- Polish the presentation',
    highlightFeatures: [
      'Headings, bold, italic, lists, and code fences',
      'Live preview updates as you type',
      'A serif editorial layout with strict hierarchy',
      'PNG for documents, SVG for the web',
    ],
    faqs: [
      {
        question: 'Which Markdown elements are supported?',
        answer:
          'Headings, bold, italic, inline code, fenced code blocks, and dash lists.',
      },
      {
        question: 'Does this sync with Notion or Obsidian?',
        answer:
          'No. You can export a PNG and place it in either app, but Typeframe does not connect to them directly.',
      },
      {
        question: 'Are tables or LaTeX supported?',
        answer:
          'Not yet. Tables, footnotes, and LaTeX are not rendered.',
      },
    ],
  },
  {
    slug: 'linkedin-post-generator',
    metaTitle: 'LinkedIn Post Graphic Generator — Typeframe',
    metaDescription:
      'Create professional LinkedIn text graphics at 1200 × 627. Editorial type, restrained surfaces, and instant export.',
    h1: 'LinkedIn Post Graphic Generator',
    category: 'LinkedIn',
    headline: 'Authority, without the noise.',
    summary:
      'A restrained landscape card for a professional feed: clear hierarchy, dark ink, and no decorative noise.',
    templateId: 'linkedin-post',
    themeId: 'architectural-digest',
    textMode: 'plain',
    defaultText:
      '“Culture is what happens when leadership leaves the room.”\n\nBuild systems that maintain excellence automatically.',
    highlightFeatures: [
      '1200 × 627 landscape, sized for the LinkedIn feed',
      'Editorial type with controlled contrast',
      'Attribution controls for name, handle, and badge',
      'Copy to clipboard or export at 2× and 4×',
    ],
    faqs: [
      {
        question: 'What size works best for a LinkedIn image post?',
        answer:
          '1200 × 627 is a reliable landscape size for single-image posts. Square 1080 × 1080 is also available.',
      },
      {
        question: 'Can I build a carousel here?',
        answer:
          'You can design a cover slide and export a PNG. Typeframe does not generate multi-page PDF carousels.',
      },
      {
        question: 'Can I use the image commercially?',
        answer:
          'Yes. Exports can be used in client work, company pages, and marketing material without attribution.',
      },
    ],
  },
  {
    slug: 'instagram-story-generator',
    metaTitle: 'Instagram Story Quote Maker — Typeframe',
    metaDescription:
      'Design 9:16 vertical quote cards for Instagram Stories and TikTok with editorial type and controlled surfaces.',
    h1: 'Instagram Story Quote Maker',
    category: 'Stories',
    headline: 'Full-height composition.',
    summary:
      'A full-height canvas for a single thought. Compose on a 1080 × 1920 artboard and keep the type clear of platform controls.',
    templateId: 'instagram-story',
    themeId: 'kinfolk',
    textMode: 'plain',
    defaultText: 'Slow down.\nYou’re not behind;\nyou’re on your own timeline.',
    highlightFeatures: [
      'Native 1080 × 1920 vertical canvas',
      'Warm paper, ink, and restrained accent surfaces',
      'Centred composition with safe margins',
      'Copy the image or download a high-resolution file',
    ],
    faqs: [
      {
        question: 'Will Instagram controls cover my text?',
        answer:
          'Keep important text away from the top and bottom edges of the canvas. The editor shows the full artboard, while platform controls can overlap its edges.',
      },
      {
        question: 'Can I share straight to Instagram?',
        answer:
          'On supported mobile browsers, Share can open the system sheet for the design link. To post the image itself, export it first.',
      },
      {
        question: 'Does the same canvas work for TikTok?',
        answer:
          'The 9:16 ratio also fits TikTok photo posts, though each platform crops slightly differently.',
      },
    ],
  },
  {
    slug: 'study-notes-card',
    metaTitle: 'Study Notes Card Generator — Typeframe',
    metaDescription:
      'Turn study notes and summaries into structured 4:5 cards with clear hierarchy and generous spacing.',
    h1: 'Study Notes Card Generator',
    category: 'Study',
    headline: 'Notes that hold their shape.',
    summary:
      'Turn a dense note into a readable card. The modular layout keeps definitions, lists, and summaries in order.',
    templateId: 'study-notes',
    themeId: 'braun-studio',
    textMode: 'plain',
    defaultText:
      'COGNITIVE LOAD THEORY\n\n1. Intrinsic load: the innate difficulty of the topic\n2. Extraneous load: how the information is presented\n3. Germane load: effort spent building understanding\n\nRule: remove extraneous design clutter.',
    highlightFeatures: [
      '4:5 portrait canvas for dense notes',
      'Structured spacing for lists and definitions',
      'Braun-inspired modular layout',
      'Free to export, with no account required',
    ],
    faqs: [
      {
        question: 'Can I make flashcards with this?',
        answer:
          'The 4:5 canvas suits definitions, summaries, and short lists. It is a static image, not an interactive flashcard app.',
      },
      {
        question: 'Is Typeframe free for students?',
        answer:
          'Yes. There is no account, no paid tier, and no export limit.',
      },
      {
        question: 'Can I change the typeface?',
        answer:
          'Yes. The default Braun-inspired layout uses IBM Plex Sans, and every typeface in the Refine panel is available.',
      },
    ],
  },
];

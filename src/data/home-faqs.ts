export interface HomeFaq {
  question: string;
  answer: string;
}

export const homeFaqs: HomeFaq[] = [
  {
    question: 'Is Typeframe free to use?',
    answer:
      'Yes. Typeframe is free, requires no account, and adds no watermark to exported images.',
  },
  {
    question: 'Does Typeframe upload my text or photos?',
    answer:
      'No. Text, settings, and uploaded photos stay in your browser. Rendering happens locally with the Canvas API, and drafts are saved to local storage on your device.',
  },
  {
    question: 'Which formats can I export?',
    answer:
      'PNG, JPEG, WebP, and SVG. Raster exports can be rendered at 1×, 2×, or 4× the canvas size.',
  },
  {
    question: 'What can I make in Typeframe?',
    answer:
      'Quote cards, code snippets, note cards, social posts, LinkedIn graphics, Instagram Stories, and study summaries.',
  },
  {
    question: 'Does the editor work on a phone?',
    answer:
      'Yes. On small screens the studio splits into Write, Artboard, and Style views so the canvas stays usable.',
  },
  {
    question: 'Are the fonts included?',
    answer:
      'Yes. Seven open-source families are self-hosted with the site, including Inter, Instrument Serif, IBM Plex Sans, and JetBrains Mono.',
  },
];

export const homeFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: homeFaqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
};

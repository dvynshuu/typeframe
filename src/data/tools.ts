import type { TemplateId, ThemeId, TextMode } from '../types';

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ToolConfig {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  h1: string;
  badge: string;
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
    metaTitle: 'Free Online Quote Card Maker — Turn Quotes into Beautiful Images | Typeframe',
    metaDescription: 'Create elegant, shareable quote cards for Instagram, LinkedIn, and Twitter. 100% free, no watermark, client-side rendering with custom fonts and mesh backgrounds.',
    keywords: 'quote card maker, online quote generator, aesthetic quote maker, quote to image converter, free quote maker without watermark, quote background generator',
    h1: 'Online Quote Card Maker',
    badge: 'Viral Quote Studio',
    summary: 'Transform quotes, inspirational thoughts, and literary excerpts into editorial-grade graphics. Export high-res PNG, JPEG, WebP, or vector SVG instantly with zero watermarks.',
    templateId: 'quote-card',
    themeId: 'kinfolk',
    textMode: 'plain',
    defaultText: '“Simplicity is the ultimate sophistication.”\n— Leonardo da Vinci',
    highlightFeatures: [
      'Square 1:1 & Story 9:16 presets tailored for Instagram and LinkedIn feeds',
      'Curated editorial serifs including Instrument Serif and Cormorant Garamond',
      'Generative backdrops: organic linen grain, soft mesh glows, and frosted glass',
      'One-click high-resolution export in PNG, JPEG, WebP, and vector SVG'
    ],
    faqs: [
      {
        question: 'Is this quote maker 100% free without watermarks?',
        answer: 'Yes, Typeframe is completely free forever. There are no watermarks, no signups required, and no hidden subscriptions.'
      },
      {
        question: 'What image formats can I export my quote card in?',
        answer: 'You can export in PNG, JPEG, and WebP for crisp social media sharing, or download scalable vector SVG for lossless print quality.'
      },
      {
        question: 'Can I copy the quote card directly to my clipboard?',
        answer: 'Yes! Click the "Copy Image" button in the top bar to place the rendered graphic on your clipboard, ready to paste directly into Twitter/X, LinkedIn, or Slack.'
      },
      {
        question: 'Are my quotes and uploads kept private?',
        answer: 'All rendering is executed 100% client-side via HTML5 Canvas in your browser. Nothing is ever sent to or stored on any server.'
      },
      {
        question: 'Where can I source quotes and mindful affirmations to format?',
        answer: 'You can format literature excerpts, poetry, or personal insights. Many mindful creators write reflections in emotional wellness tools like <a href="https://getrealign.in" target="_blank" rel="noopener">ReAlign</a> and import their daily affirmations into Typeframe to generate aesthetic visual cards.'
      }
    ]
  },
  {
    slug: 'code-to-image',
    metaTitle: 'Code Snippet to Image Generator — Clean Ray.so & Carbon Alternative | Typeframe',
    metaDescription: 'Convert code snippets into beautiful, syntax-highlighted images. Fast, lightweight, vector SVG & PNG export. 100% private, no signup required.',
    keywords: 'code to image, code snippet to image, carbon alternative, ray.so alternative, code screenshot generator, beautiful code screenshots, render code to png',
    h1: 'Code Snippet to Image Generator',
    badge: 'Developer Favorite',
    summary: 'The fastest, private alternative to Carbon and Ray.so. Transform code blocks into crisp, shareable screenshots with JetBrains Mono, syntax styling, custom padding, and dark aesthetics.',
    templateId: 'code-snippet',
    themeId: 'studio-dark',
    textMode: 'markdown',
    defaultText: '```typescript\n// Typeframe: Instant typography at 60fps\ninterface CreatorCard {\n  typography: "editorial";\n  rendering: "100% client-side canvas";\n  privacy: "absolute";\n}\n```',
    highlightFeatures: [
      'Pre-configured with JetBrains Mono monospace font and dark studio aesthetic',
      'Dual rendering pipeline supporting both raster PNG and vector SVG',
      'Absolute privacy: your proprietary code stays inside your local browser',
      'Interactive drag handles to fine-tune snippet bounds and padding'
    ],
    faqs: [
      {
        question: 'Why choose Typeframe over Carbon or Ray.so?',
        answer: 'Typeframe is lightweight, zero-latency, requires no account, supports markdown code fences, and lets you switch between code snippets, quotes, and editorial cards seamlessly.'
      },
      {
        question: 'Can I export vector SVG code snippets?',
        answer: 'Yes! Select the SVG export pill to download an infinitely scalable vector graphic ideal for technical documentation, blog headers, and book prints.'
      },
      {
        question: 'Does Typeframe upload my code to an external server?',
        answer: 'No. Typeframe processes all text, syntax, and pixels locally on your machine via HTML5 Canvas.'
      }
    ]
  },
  {
    slug: 'apple-notes-quote-generator',
    metaTitle: 'Apple Notes Quote Generator — Aesthetic Notes Screenshot Maker | Typeframe',
    metaDescription: 'Create authentic Apple Notes style quote graphics and screenshots online. Subtle paper texture, clean typography, and instant copy to clipboard.',
    keywords: 'apple notes quote generator, fake notes app generator, apple notes screenshot generator, aesthetic notes maker, notes app meme generator, text card maker',
    h1: 'Aesthetic Apple Notes Quote Generator',
    badge: 'Trending Aesthetic',
    summary: 'Generate viral Apple Notes style screenshot cards with authentic paper backgrounds, clean typography, and zero watermark. Perfect for TikTok, Instagram, and Twitter/X.',
    templateId: 'study-notes',
    themeId: 'apple-notes',
    textMode: 'plain',
    defaultText: 'Things I learned this year:\n\n1. Consistency beats intensity every single time.\n2. Design for clarity, not decorative complexity.\n3. Keep your creative tools fast, minimal, and private.',
    highlightFeatures: [
      'Realistic warm paper background texture with authentic yellow masthead',
      'Clean sans-serif typography with comfortable reading leading',
      'Instant 1-click clipboard copying for Twitter/X threads and Stories',
      'Customizable dimensions: 4:5 feed ratio or 9:16 vertical story'
    ],
    faqs: [
      {
        question: 'Why are Apple Notes screenshots so popular on social media?',
        answer: 'Apple Notes style cards feel raw, authentic, and unmanufactured. Studies show personal, note-style graphics achieve significantly higher engagement and retweets than over-designed corporate banners.'
      },
      {
        question: 'Can I customize the text or font in this generator?',
        answer: 'Yes! You have full control over font size, weight, line height, alignment, and background tone in the Refine panel.'
      },
      {
        question: 'Is this free to use without registration?',
        answer: 'Yes, 100% free with unlimited exports and zero watermarks.'
      }
    ]
  },
  {
    slug: 'tweet-to-image',
    metaTitle: 'Tweet to Image Converter — Turn X & Twitter Posts into Images | Typeframe',
    metaDescription: 'Convert tweets, thoughts, and text into gorgeous 16:9 and 1:1 social media images. High resolution, custom gradients, and 1-click clipboard copy.',
    keywords: 'tweet to image, convert tweet to image, twitter quote maker, tweet screenshot generator, x post to image, social card generator',
    h1: 'Tweet to Image Converter',
    badge: 'Social Studio',
    summary: 'Turn short-form thoughts and tweet-style quotes into attention-grabbing social visuals optimized for Twitter, LinkedIn, and Instagram feeds.',
    templateId: 'twitter-post',
    themeId: 'studio-dark',
    textMode: 'plain',
    defaultText: 'The best tools don’t feel like work.\nThey feel like play with high-leverage outputs.',
    highlightFeatures: [
      'Native 16:9 (1200×675) Twitter landscape and 1:1 feed ratios',
      'Rich gradient and mesh backdrops that pop on dark mode feeds',
      'Drag-and-nudge text blocks for pixel-perfect compositional balance',
      'Zero lossy compression: export high-DPI PNGs with crisp typography'
    ],
    faqs: [
      {
        question: 'Do I need to connect my Twitter account?',
        answer: 'No! Typeframe does not require any account login or Twitter API connection. Simply paste or type your message, style it, and export.'
      },
      {
        question: 'What is the best image ratio for Twitter/X posts?',
        answer: '16:9 (1200×675) is optimal for landscape timeline posts, while 1:1 (1080×1080) works best for multi-platform cross-posting.'
      }
    ]
  },
  {
    slug: 'markdown-to-image',
    metaTitle: 'Markdown to Image Converter — Render Markdown Cards Online | Typeframe',
    metaDescription: 'Convert raw Markdown text, lists, and formatted notes into aesthetic image cards for documentation, Notion, Obsidian, and social posts.',
    keywords: 'markdown to image, markdown to png, convert markdown to graphic, markdown card generator, render markdown to png, text to image converter',
    h1: 'Markdown to Image Converter',
    badge: 'Markdown Native',
    summary: 'Render markdown formatting (headers, bold, italics, code blocks, lists) directly into high-fidelity raster and vector images.',
    templateId: 'blog-snippet',
    themeId: 'economist',
    textMode: 'markdown',
    defaultText: '# The Creative Process\n\n**Ideas** are cheap. *Execution* is everything.\n\n- Write daily with strict focus\n- Cut ruthless fluff and noise\n- Polish visual presentation',
    highlightFeatures: [
      'Full Markdown syntax support: headings (#), bold (**), italic (*), and code blocks',
      'The Economist editorial layout with strict hierarchy and classic serif typography',
      'Export directly to PNG for Notion dashboards or SVG for web embeds',
      'Real-time live preview rendering as you type'
    ],
    faqs: [
      {
        question: 'Which Markdown elements are supported?',
        answer: 'Typeframe supports headings (H1/H2), bold emphasis, italic styling, inline code, fenced code blocks, and lists.'
      },
      {
        question: 'Can I use this for Notion or Obsidian notes?',
        answer: 'Absolutely! Many creators use Typeframe to turn key excerpts from Notion or Obsidian into shareable visual cards.'
      }
    ]
  },
  {
    slug: 'linkedin-post-generator',
    metaTitle: 'LinkedIn Text Post Graphic Generator — Professional Quote Cards | Typeframe',
    metaDescription: 'Create high-engagement LinkedIn graphics and quote cards in professional 1200x627 resolution. Clean editorial layouts that stop the scroll.',
    keywords: 'linkedin post graphic generator, linkedin quote card, linkedin text card maker, professional quote generator, b2b social graphics',
    h1: 'LinkedIn Post Graphic Generator',
    badge: 'Executive Branding',
    summary: 'Boost your LinkedIn impressions with editorial quote cards and text graphics tailored to professional feeds and carousel cover slides.',
    templateId: 'linkedin-post',
    themeId: 'architectural-digest',
    textMode: 'plain',
    defaultText: '“Culture is what happens when leadership leaves the room.”\n\nBuild systems that maintain excellence automatically.',
    highlightFeatures: [
      'Standard 1200×627 landscape format engineered for the LinkedIn desktop and mobile feed',
      'Sophisticated architectural luxury theme with geometric discipline and high contrast',
      'Clean typographic hierarchy that commands authority without looking like generic clip-art',
      'Instant copy-to-clipboard for quick pasting directly into the LinkedIn post creator'
    ],
    faqs: [
      {
        question: 'What dimensions does LinkedIn prefer for single-image posts?',
        answer: '1200×627 pixels (1.91:1) is the standard landscape ratio for desktop and mobile feeds. Square (1080×1080) is also supported in Typeframe.'
      },
      {
        question: 'Can I use these images for carousel cover slides?',
        answer: 'Yes! You can design your hook slide in Typeframe and export in high-resolution PNG or PDF/SVG.'
      }
    ]
  },
  {
    slug: 'instagram-story-generator',
    metaTitle: 'Instagram Story Quote Maker — 9:16 Aesthetic Vertical Cards | Typeframe',
    metaDescription: 'Design full-bleed 9:16 vertical quote cards and text graphics for Instagram Stories & TikTok. Beautiful mesh gradients and luxury fonts.',
    keywords: 'instagram story quote maker, 9:16 text to image, vertical quote card generator, aesthetic story text maker, story graphic creator',
    h1: 'Instagram Story Quote Maker',
    badge: 'Story Mode',
    summary: 'Craft striking 9:16 vertical cards with soft mesh glows, luxury serifs, and high-impact typography designed for mobile smartphone screens.',
    templateId: 'instagram-story',
    themeId: 'kinfolk',
    textMode: 'plain',
    defaultText: 'Slow down.\nYou’re not behind;\nyou’re on your own timeline.',
    highlightFeatures: [
      'Native 1080×1920 (9:16) vertical resolution engineered for Instagram Stories and TikTok',
      'Curated atmospheric backgrounds: Aurora mesh, sunset gradients, and minimal linen',
      'Centered layout hint ensuring text remains safely inside Instagram UI margins',
      'Instant Web Share API support on mobile devices'
    ],
    faqs: [
      {
        question: 'Will the text get cut off by Instagram Story icons?',
        answer: 'No. Typeframe automatically applies safe margin buffers so your typography sits perfectly in the center viewing zone.'
      },
      {
        question: 'Can I share directly to Instagram on iPhone or Android?',
        answer: 'Yes! On mobile browsers, the Share button opens the native system share sheet, letting you send the image directly to Instagram Stories.'
      }
    ]
  },
  {
    slug: 'study-notes-card',
    metaTitle: 'Aesthetic Study Notes Card Generator — Revision Flashcards | Typeframe',
    metaDescription: 'Turn study notes, key takeaways, and flashcard summaries into clean 4:5 visual cards. Perfect for Notion, Obsidian, and student study grams.',
    keywords: 'study notes card generator, aesthetic revision card maker, flashcard quote generator, student notes to image, summary card creator',
    h1: 'Aesthetic Study Notes Card Generator',
    badge: 'Knowledge Cards',
    summary: 'Organize revision summaries, flashcard quotes, and book notes into minimalist, shareable visual study cards.',
    templateId: 'study-notes',
    themeId: 'braun-studio',
    textMode: 'plain',
    defaultText: 'COGNITIVE LOAD THEORY\n\n1. Intrinsic Load: The innate difficulty of the topic\n2. Extraneous Load: How information is presented\n3. Germane Load: Mind work dedicated to schema building\n\nRule: Eliminate extraneous design clutter.',
    highlightFeatures: [
      'Balanced 4:5 (1080×1350) portrait ratio for maximum vertical canvas real estate',
      'Braun Studio aesthetic inspired by Dieter Rams: functional, modular, and distraction-free',
      'Structured line spacing and tracking designed for high legibility and quick memorization',
      'Zero clutter: download clean visual summaries for student study groups'
    ],
    faqs: [
      {
        question: 'Can I make flashcards with this generator?',
        answer: 'Yes! The 4:5 portrait aspect ratio is tailored for structured bullet points, definitions, and key revision takeaways.'
      },
      {
        question: 'Is Typeframe free for students?',
        answer: 'Yes, Typeframe is 100% free for everyone, with no limits or paid paywalls.'
      }
    ]
  }
];

export function getToolBySlug(slug: string): ToolConfig | undefined {
  return toolsData.find((tool) => tool.slug === slug);
}

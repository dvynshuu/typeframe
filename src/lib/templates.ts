import type { Template, TemplateId } from '../types';

export const templates: Template[] = [
  {
    id: 'quote-card',
    name: 'Quote Card',
    width: 1080,
    height: 1080,
    description: 'Centered inspirational quotes',
    layoutHint: 'centered',
    defaultTypography: { fontSize: 52, textAlign: 'center', lineHeight: 1.35 },
  },
  {
    id: 'twitter-post',
    name: 'Twitter Post',
    width: 1200,
    height: 675,
    description: '16:9 social post',
    layoutHint: 'social',
    defaultTypography: { fontSize: 36, textAlign: 'left', lineHeight: 1.4 },
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    width: 1080,
    height: 1920,
    description: '9:16 vertical story',
    layoutHint: 'centered',
    defaultTypography: { fontSize: 44, textAlign: 'center', lineHeight: 1.3 },
  },
  {
    id: 'instagram-post',
    name: 'Instagram Post',
    width: 1080,
    height: 1080,
    description: 'Square feed post',
    layoutHint: 'centered',
    defaultTypography: { fontSize: 40, textAlign: 'center', lineHeight: 1.35 },
  },
  {
    id: 'linkedin-post',
    name: 'LinkedIn Post',
    width: 1200,
    height: 627,
    description: 'Professional landscape',
    layoutHint: 'editorial',
    defaultTypography: { fontSize: 32, textAlign: 'left', lineHeight: 1.45 },
  },
  {
    id: 'study-notes',
    name: 'Study Notes',
    width: 1080,
    height: 1350,
    description: 'Structured note cards',
    layoutHint: 'editorial',
    defaultTypography: { fontSize: 28, textAlign: 'left', lineHeight: 1.55 },
  },
  {
    id: 'announcement',
    name: 'Announcement',
    width: 1080,
    height: 1080,
    description: 'Bold product launches',
    layoutHint: 'centered',
    defaultTypography: { fontSize: 56, fontWeight: 700, textAlign: 'center' },
  },
  {
    id: 'blog-snippet',
    name: 'Blog Snippet',
    width: 1080,
    height: 1350,
    description: 'Editorial article excerpt',
    layoutHint: 'editorial',
    defaultTypography: { fontSize: 34, textAlign: 'left', lineHeight: 1.6 },
  },
  {
    id: 'code-snippet',
    name: 'Code Snippet',
    width: 1080,
    height: 1080,
    description: 'Syntax-highlighted code card',
    layoutHint: 'code',
    defaultTypography: {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 18,
      textAlign: 'left',
      lineHeight: 1.55,
    },
  },
];

export function getTemplate(id: TemplateId): Template {
  return templates.find((t) => t.id === id) ?? templates[0];
}

export const presetSizes = [
  { id: '1080x1080' as const, label: '1080 × 1080', width: 1080, height: 1080 },
  { id: '1080x1350' as const, label: '1080 × 1350', width: 1080, height: 1350 },
  { id: '1080x1920' as const, label: '1080 × 1920', width: 1080, height: 1920 },
  { id: '1920x1080' as const, label: '1920 × 1080', width: 1920, height: 1080 },
  { id: 'custom' as const, label: 'Custom', width: 0, height: 0 },
];

// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://typeframe.pages.dev',
  compressHTML: true,

  build: {
    inlineStylesheets: 'auto',
  },

  vite: {
    worker: {
      format: 'es',
    },
  },

  integrations: [sitemap()],
});
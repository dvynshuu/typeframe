// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    worker: {
      format: 'es',
    },
  },
});

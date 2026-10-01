// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.breakfreeworldwide.com',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'auto' },
  image: {
    // Responsive images are generated at build time as AVIF/WebP.
    responsiveStyles: false,
  },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});

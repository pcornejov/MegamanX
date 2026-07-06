import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://pcornejov.github.io',
  base: '/megamanx',
  trailingSlash: 'never',
  integrations: [sitemap()],
});

// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// DEPLOY_TARGET=pages builds the GitHub Pages client preview (subpath + noindex).
// Default build is production for the live domain on Cloudflare.
const isPagesPreview = process.env.DEPLOY_TARGET === 'pages';

export default defineConfig({
  site: isPagesPreview
    ? 'https://minodesignstudio.github.io'
    : 'https://www.huntermarketing.co',
  base: isPagesPreview ? '/hunter-marketing' : '/',
  trailingSlash: 'ignore',
  compressHTML: true,
  integrations: [sitemap()],
});

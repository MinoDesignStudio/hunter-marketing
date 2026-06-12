# Hunter Marketing Co. website

Astro static site for [huntermarketing.co](https://www.huntermarketing.co). Built by Mino Design Studio.

## Pages

- `/` - Homepage
- `/services/marketing-plan-in-a-day/` - 1:1 Marketing Plan in a Day
- `/services/marketing-plan-in-a-day-brand-photos/` - Marketing Plan in a Day + Brand Photos (Group Program)

## Develop

```sh
npm install
npm run dev      # local dev server
npm run build    # production build to ./dist
npm run preview  # serve the production build locally
```

## Deployments

**Client preview (automatic):** every push to `main` builds and publishes to
GitHub Pages at https://minodesignstudio.github.io/hunter-marketing/.
The preview build sets `DEPLOY_TARGET=pages`, which switches the site URL,
adds the `/hunter-marketing` base path, and adds a `noindex` tag so search
engines ignore the preview.

**Production (go-live, after client approval):** import this repo in the
client's Cloudflare account (Workers & Pages → Import from GitHub), build
command `npm run build`, deploy directory `dist` (wrangler.jsonc is already
configured). Do NOT set `DEPLOY_TARGET`. Then attach the custom domain
`www.huntermarketing.co` and redirect the apex to www.

## Notes

- Source designs: OneDrive → Client Projects → Hunter Marketing → Website
- Page styles live per page in `src/styles/` (ported verbatim from the
  approved HTML designs); shared header/footer are components.
- Images are optimised at build time via `astro:assets`.

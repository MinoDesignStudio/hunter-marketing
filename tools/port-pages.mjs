// One-off migration helper: pulls the CSS blocks and body markup out of the
// cleaned source HTMLs into the Astro project, verbatim, so page content is
// never retyped by hand. Targeted edits happen after this runs.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SRC = join(ROOT, '_source');

function styleBlocks(html) {
  return [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
}

function stripFontImports(css) {
  return css.replace(/@import url\('https:\/\/fonts\.googleapis\.com[^']*'\);\n?/g, '');
}

mkdirSync(join(ROOT, 'src', 'styles'), { recursive: true });
mkdirSync(join(ROOT, 'src', 'pages', 'services'), { recursive: true });

// ---------- CSS ----------
const home = readFileSync(join(SRC, 'home.html'), 'utf8');
const mpiad = readFileSync(join(SRC, 'mpiad.html'), 'utf8');
const mpiadBp = readFileSync(join(SRC, 'mpiad-bp.html'), 'utf8');

let homeCss = stripFontImports(styleBlocks(home)[0])
  .replace("url('EXTRACTED:home-embedded-2.png')", "url('../assets/blob-icon-bg.png')");
// The source page's tweaks script sets the body font to Helvetica at runtime;
// the panel is gone, so the resolved value is baked in here.
homeCss += "\n:root { --body-font: Helvetica, 'Helvetica Neue', Arial, sans-serif; }\n";
writeFileSync(join(ROOT, 'src', 'styles', 'home.css'), homeCss);

let mpiadCss = styleBlocks(mpiad).map(stripFontImports).join('\n')
  .replace("url('EXTRACTED:mpiad-embedded-2.png')", "url('../assets/blob-icon-bg.png')");
mpiadCss += "\n.svc-parallax { background-image: url('../assets/parallax-mpiad.jpg'); }\n";
writeFileSync(join(ROOT, 'src', 'styles', 'mpiad.css'), mpiadCss);

let bpCss = styleBlocks(mpiadBp).map(stripFontImports).join('\n')
  .replace("url('EXTRACTED:mpiad-bp-embedded-2.png')", "url('../assets/blob-icon-bg.png')")
  .replace("url('EXTRACTED:mpiad-bp-embedded-3.png')", "url('../assets/blob-icon-bg.png')");
bpCss += "\n.svc-parallax { background-image: url('../assets/parallax-mpiad-bp.jpg'); }\n";
writeFileSync(join(ROOT, 'src', 'styles', 'mpiad-bp.css'), bpCss);

// ---------- body markup ----------
function body(html) {
  return html.match(/<body>([\s\S]*?)<\/body>/)[1].trim();
}

// Homepage: the SVG blob defs live in <head> in the source; bring them into
// the body like the services pages do. Drop the React/tweaks blocks.
const svgDefs = home.match(/<svg width="0" height="0"[\s\S]*?<\/svg>/)[0];
let homeBody = body(home);
homeBody = homeBody.replace(/<!-- Tweaks panel[\s\S]*$/, '').trim();
homeBody = `${svgDefs}\n\n${homeBody}`;

const pages = [
  { out: join(ROOT, 'src', 'pages', 'index.astro'), markup: homeBody, css: 'home.css' },
  { out: join(ROOT, 'src', 'pages', 'services', 'marketing-plan-in-a-day.astro'), markup: body(mpiad), css: 'mpiad.css' },
  { out: join(ROOT, 'src', 'pages', 'services', 'marketing-plan-in-a-day-brand-photos.astro'), markup: body(mpiadBp), css: 'mpiad-bp.css' },
];

for (const { out, markup, css } of pages) {
  const depth = out.includes('/services/') ? '../../' : '../';
  const astro = `---
import BaseLayout from '${depth}layouts/BaseLayout.astro';
import '${depth}styles/${css}';
---
<BaseLayout>
${markup}
</BaseLayout>
`;
  writeFileSync(out, astro);
  console.log(`${out.replace(ROOT + '/', '')}: ${(astro.length / 1024).toFixed(0)}KB`);
}

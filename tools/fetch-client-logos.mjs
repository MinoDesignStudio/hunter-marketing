// One-off: fetch each client's logo from their website into src/assets/clients/.
// Heuristic: first <img> (or inline <svg>) inside the header/nav whose
// src/class/alt mentions "logo"; falls back to any img with "logo" in the src,
// then og:image. Review every file by hand afterwards.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'clients');
mkdirSync(OUT, { recursive: true });

const CLIENTS = [
  ['tps', 'https://tps.com.au/'],
  ['dchouse', 'https://dchouse.com.au/fast-track-granny-flats/'],
  ['packagedit', 'https://www.packagedit.com.au/'],
  ['ritualhaus', 'https://ritualhaus.com.au/'],
  ['bscaa', 'https://bscaa.com/'],
  ['studyworkgrow', 'https://studyworkgrow.com/'],
  ['secureminded', 'https://www.secureminded.au/'],
  ['spsfacilities', 'https://www.spsfacilities.com/'],
  ['paramco', 'https://paramco.com.au/'],
  ['futurefemales', 'https://futurefemalesaustralia.com.au/'],
  ['urbanmetal', 'https://www.urbanmetal.com.au/'],
  ['nurturingconfidence', 'https://www.nurturingconfidence.com.au/'],
  ['sociallyconstructed', 'https://www.socially-constructed.com/index'],
  ['thesolomons', 'https://thesolomons.com.au/capital/'],
  ['elenidracakis', 'https://elenidracakis.co/'],
  ['winningmedia', 'https://www.winningmedia.com.au/'],
  ['shifft', 'https://shifft.com.au/'],
  ['mcs', 'https://www.mcs.au/'],
  ['steinart', 'https://steinart.com.au/'],
  ['oladigital', 'https://oladigital.co/'],
  ['jackimcpherson', 'https://www.jackimcpherson.com.au/'],
  ['cemoh', 'https://cemoh.com/'],
  ['mino', 'https://minodesignanddigital.com.au/'],
];

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const fetchText = async (url) => {
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,*/*' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
};

const extFor = (url, contentType) => {
  const m = url.split('?')[0].match(/\.(svg|png|webp|jpe?g|gif|avif)$/i);
  if (m) return m[1].toLowerCase().replace('jpeg', 'jpg');
  if (/svg/.test(contentType)) return 'svg';
  if (/png/.test(contentType)) return 'png';
  if (/webp/.test(contentType)) return 'webp';
  if (/avif/.test(contentType)) return 'avif';
  return 'jpg';
};

// candidate <img> tags whose attributes mention "logo", best-first
function findLogoCandidates(html, baseUrl) {
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => ({ tag: m[0], idx: m.index }));
  const scored = [];
  for (const { tag, idx } of imgs) {
    const src =
      tag.match(/\bdata-src\s*=\s*["']([^"']+)["']/i)?.[1] ||
      tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!src || src.startsWith('data:image/gif')) continue;
    const hay = tag.toLowerCase();
    let score = 0;
    if (/logo/.test(src.toLowerCase())) score += 4;
    if (/class\s*=\s*["'][^"']*logo/.test(hay)) score += 3;
    if (/alt\s*=\s*["'][^"']*logo/.test(hay)) score += 2;
    if (/(header|navbar|site-logo|brand)/.test(hay)) score += 1;
    if (/(white|light|footer|rev|inverse)/.test(src.toLowerCase())) score -= 2;
    if (score > 0) scored.push({ src, score, idx });
  }
  // prefer higher score, then earlier in the document (header logos come first)
  scored.sort((a, b) => b.score - a.score || a.idx - b.idx);
  const og = html.match(/property\s*=\s*["']og:image["'][^>]*content\s*=\s*["']([^"']+)["']/i)?.[1] ||
             html.match(/content\s*=\s*["']([^"']+)["'][^>]*property\s*=\s*["']og:image["']/i)?.[1];
  const urls = scored.map((s) => s.src);
  if (og) urls.push(og);
  return [...new Set(urls)].map((u) => new URL(u.replace(/&amp;/g, '&'), baseUrl).href);
}

for (const [slug, site] of CLIENTS) {
  try {
    const html = await fetchText(site);
    const candidates = findLogoCandidates(html, site);
    if (!candidates.length) { console.log(`MISS  ${slug}  (no candidates)`); continue; }
    let saved = false;
    for (const url of candidates.slice(0, 4)) {
      try {
        const res = await fetch(url, { headers: { 'user-agent': UA } });
        if (!res.ok) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 200) continue;
        const ext = extFor(url, res.headers.get('content-type') || '');
        writeFileSync(join(OUT, `${slug}.${ext}`), buf);
        console.log(`OK    ${slug}.${ext}  ${(buf.length / 1024).toFixed(1)}KB  <- ${url}`);
        saved = true;
        break;
      } catch { /* try next candidate */ }
    }
    if (!saved) console.log(`MISS  ${slug}  (candidates failed: ${candidates[0]})`);
  } catch (e) {
    console.log(`FAIL  ${slug}  ${e.message}`);
  }
}

// One-off migration helper: pulls base64 data-URI images out of the source
// HTMLs into real files and writes cleaned HTML copies for porting to Astro.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = '/Users/sarahrail/Library/CloudStorage/OneDrive-MinoDesignStudio/Claude/Client Projects/Hunter Marketing/Website';
const OUT = join(import.meta.dirname, '..', '_source');

const pages = [
  { file: join(SRC, 'Hunter Marketing Homepage', 'Hunter Marketing Homepage.html'), slug: 'home' },
  { file: join(SRC, 'Services', 'Marketing Plan in a day', 'Marketing Plan in a Day.html'), slug: 'mpiad' },
  { file: join(SRC, 'Services', 'Marketing Plan in a day and brand photos', 'Marketing Plan in a Day and Brand Photos.html'), slug: 'mpiad-bp' },
];

mkdirSync(join(OUT, 'extracted'), { recursive: true });

for (const { file, slug } of pages) {
  let html = readFileSync(file, 'utf8');
  let n = 0;
  html = html.replace(
    /data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,([A-Za-z0-9+/=]+)/g,
    (_, type, b64) => {
      n += 1;
      const ext = type === 'svg+xml' ? 'svg' : type === 'jpeg' ? 'jpg' : type;
      const name = `${slug}-embedded-${n}.${ext}`;
      writeFileSync(join(OUT, 'extracted', name), Buffer.from(b64, 'base64'));
      return `EXTRACTED:${name}`;
    },
  );
  writeFileSync(join(OUT, `${slug}.html`), html);
  console.log(`${slug}: ${n} embedded images extracted, cleaned HTML ${(html.length / 1024).toFixed(0)}KB`);
}

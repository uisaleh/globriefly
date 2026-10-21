// Makes a ready-to-post Facebook kit for one story: the photocard PNG plus the caption and first comment.
// Usage: node agent/make-card.mjs <story-slug>   (or a full story URL)
// Output: public/cards/<slug>.png and public/cards/<slug>.txt — downloadable from the site at /cards/<slug>.png
import fs from 'node:fs';
import path from 'node:path';
import { renderCard } from './card.mjs';
import { buildCaption } from './facebook.mjs';
import { env } from './config.mjs';
import { POSTS_DIR, ROOT, readJSON, log } from './util.mjs';

const arg = (process.argv[2] || '').trim().replace(/\/+$/, '');
const slug = arg.split('/').pop();
if (!slug) {
  console.error('Give a story slug, e.g. node agent/make-card.mjs amazon-invests-in-twelve-small-nuclear-reactors-for-indiana-energy');
  process.exit(1);
}
const file = path.join(POSTS_DIR, `${slug}.json`);
if (!fs.existsSync(file)) {
  console.error(`No story found: ${file}`);
  process.exit(1);
}
const post = readJSON(file);
const url = `${env.SITE_URL}/news/${post.slug}/`;
const outDir = path.join(ROOT, 'public', 'cards');
fs.mkdirSync(outDir, { recursive: true });

const png = await renderCard(post);
fs.writeFileSync(path.join(outDir, `${slug}.png`), png);

const caption = buildCaption({ ...post }, url).replace('Full story in the first comment.', `Read the full story: ${url}`);
const text = `CAPTION (paste as the post text)
-------------------------------
${caption}

FIRST COMMENT (optional)
------------------------
Read the full story: ${url}

IMAGE
-----
${env.SITE_URL}/cards/${slug}.png
Alt text: ${post.image?.alt || post.headline}
`;
fs.writeFileSync(path.join(outDir, `${slug}.txt`), text);
log(`photocard ready: public/cards/${slug}.png (${Math.round(png.length / 1024)} KB)`);
console.log('\n' + text);
process.exit(0);

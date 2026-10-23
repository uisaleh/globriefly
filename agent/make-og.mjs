// Renders the 1200×630 link-preview image for stories that don't have one yet (or all with --all,
// or specific slugs). Saves public/og/<slug>.jpg and records it on the post as `ogImage`.
// Usage: node agent/make-og.mjs [--all] [slug ...]
import fs from 'node:fs';
import path from 'node:path';
import { saveOg } from './card.mjs';
import { POSTS_DIR, readJSON, log } from './util.mjs';

const args = process.argv.slice(2);
const all = args.includes('--all');
const only = args.filter((a) => !a.startsWith('--')).map((a) => a.replace(/\/+$/, '').split('/').pop());
let made = 0;
for (const name of fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.json'))) {
  const file = path.join(POSTS_DIR, name);
  const post = readJSON(file);
  if (only.length ? !only.includes(post.slug) : !all && post.ogImage) continue;
  try {
    post.ogImage = await saveOg(post);
    fs.writeFileSync(file, JSON.stringify(post, null, 2) + '\n');
    made++;
    log(`  ✓ ${post.ogImage}`);
  } catch (e) {
    log(`  ✗ ${post.slug}: ${e.message}`);
  }
}
log(`link previews made: ${made}`);
process.exit(0);

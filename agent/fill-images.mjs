// Finds a licensed photo for published stories that have none (Wikimedia → Openverse → Pexels/Unsplash if keys set).
// Usage: node agent/fill-images.mjs                       → stories with no photo
//        node agent/fill-images.mjs "slug=search words; slug2=other words"  → re-pick a photo for those stories
import fs from 'node:fs';
import path from 'node:path';
import { findImage } from './images.mjs';
import { POSTS_DIR, readJSON, log } from './util.mjs';

const overrides = Object.fromEntries((process.argv[2] || '').split(';').map((x) => x.split('=').map((y) => y.trim())).filter(([k, v]) => k && v)
  .map(([k, v]) => [k.replace(/\/+$/, '').split('/').pop(), v]));
let filled = 0, missing = 0;
for (const name of fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.json'))) {
  const file = path.join(POSTS_DIR, name);
  const post = readJSON(file);
  const query = overrides[post.slug];
  if (Object.keys(overrides).length ? !query : post.image?.src) continue;
  const tags = (post.tags || []).filter((t) => t && t.length > 2).slice(0, 4);
  let img = null;
  if (query) {
    const [q1, q2] = query.split('|').map((x) => x.trim());
    img = await findImage(q1, q2, post.headline);
  }
  for (let i = 0; i < tags.length && !img && !query; i += 2) {
    img = await findImage(tags[i], tags[i + 1], post.headline);
  }
  if (img) {
    post.image = img;
    post.updatedAt = post.updatedAt || post.publishedAt;
    fs.writeFileSync(file, JSON.stringify(post, null, 2) + '\n');
    filled++;
    log(`  ✓ ${post.slug} ← ${img.provider} (${img.credit}, ${img.license})`);
  } else {
    missing++;
    log(`  · ${post.slug}: no licensed photo found`);
  }
}
log(`photos filled: ${filled}, still without photo: ${missing}`);
process.exit(0);

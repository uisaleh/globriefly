// Finds a licensed photo for published stories that have none (Wikimedia → Openverse → Pexels/Unsplash if keys set).
// Usage: node agent/fill-images.mjs                       → stories with no photo
//        node agent/fill-images.mjs "slug=search words; slug2=other words"  → re-pick a photo for those stories
import fs from 'node:fs';
import path from 'node:path';
import { findImage, findImageFor } from './images.mjs';
import { categoryBySlug } from '../site.config.mjs';
import { POSTS_DIR, readJSON, log } from './util.mjs';

const overrides = Object.fromEntries((process.argv[2] || '').split(';').map((x) => x.split('=').map((y) => y.trim())).filter(([k, v]) => k && v)
  .map(([k, v]) => [k.replace(/\/+$/, '').split('/').pop(), v]));
let filled = 0, missing = 0;
for (const name of fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.json'))) {
  const file = path.join(POSTS_DIR, name);
  const post = readJSON(file);
  const query = overrides[post.slug];
  if (Object.keys(overrides).length ? !query : post.image?.src) continue;
  let img = null;
  if (query) {
    const [q1, q2] = query.split('|').map((x) => x.trim());
    img = await findImage(q1, q2, post.headline);
  } else {
    // Same order as new stories: the story's photo idea → names in the headline → the general subject.
    const s = post.imageSearch || {};
    img = await findImageFor({
      imageQuery: s.query || '',
      imageNames: s.names || [],
      imageSubject: s.subject || '',
      fallbackSubject: `${categoryBySlug[post.category]?.label || ''} ${post.tags?.[0] || ''}`.trim(),
      headline: post.headline,
      tags: post.tags || [],
    }, post.headline);
  }
  if (img) {
    post.image = img;
    post.updatedAt = post.updatedAt || post.publishedAt;
    fs.writeFileSync(file, JSON.stringify(post, null, 2) + '\n');
    filled++;
    log(`  ✓ ${post.slug} ← ${img.provider} via ${img.matchedBy || 'search'} "${img.query || ''}" (${img.credit}, ${img.license})`);
  } else {
    missing++;
    log(`  · ${post.slug}: no licensed photo found`);
  }
}
log(`photos filled: ${filled}, still without photo: ${missing}`);
process.exit(0);

// Renders photocards for the newest posts (or the sample posts) into .cache/cards so you can check the design.
// Usage: npm run card
import path from 'node:path';
import fs from 'node:fs';
import { saveCard } from './card.mjs';
import { loadPosts, readJSON, ROOT } from './util.mjs';

let posts = loadPosts();
if (!posts.length) {
  const dir = path.join(ROOT, 'content', 'samples');
  posts = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => readJSON(path.join(dir, f)));
}
const out = path.join(ROOT, '.cache', 'cards');
const seen = new Set();
for (const p of posts) {
  if (seen.has(p.category)) continue; // one per category
  seen.add(p.category);
  console.log('card:', await saveCard(p, out));
}

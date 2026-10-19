// Shares newly published stories to the Facebook Page once their page is live on the site.
import path from 'node:path';
import fs from 'node:fs';
import { env } from './config.mjs';
import { facebookReady, shareToFacebook } from './facebook.mjs';
import { renderCard } from './card.mjs';
import { loadPosts, writeJSON, fetchWithTimeout, log, sleep, ROOT } from './util.mjs';

const CARD_CACHE = path.join(ROOT, '.cache', 'cards');
const MAX_PER_RUN = Number(process.env.FB_MAX_PER_RUN || 4);

async function isLive(url) {
  try {
    const res = await fetchWithTimeout(url, { method: 'GET' }, 15000);
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  if (!facebookReady()) { log('Facebook not configured — skipping share'); return; }
  const queue = loadPosts()
    .filter((p) => p.status === 'published' && !p.facebook?.postId && !p.facebook?.skip && Date.now() - new Date(p.publishedAt) < 48 * 36e5)
    .sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt))
    .slice(0, MAX_PER_RUN);

  for (const post of queue) {
    const url = `${env.SITE_URL}/news/${post.slug}/`;
    if (!(await isLive(url))) { log(`not live yet: ${url}`); continue; }
    const cached = path.join(CARD_CACHE, `${post.slug}.png`);
    const png = fs.existsSync(cached) ? fs.readFileSync(cached) : await renderCard(post);
    try {
      const postId = await shareToFacebook(post, png, url);
      const { file, ...data } = post;
      writeJSON(file, { ...data, facebook: { postId, sharedAt: new Date().toISOString() } });
      log(`✓ shared: ${post.headline}`);
    } catch (e) {
      log(`share failed: ${e.message}`);
    }
    await sleep(15000);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

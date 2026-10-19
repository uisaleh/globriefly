// Globriefly news agent: collect → pick → write → image → photocard → save.
// Runs hourly in GitHub Actions. Facebook sharing happens in share.mjs once the site has deployed.
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { env } from './config.mjs';
import { collectItems, clusterItems } from './collect.mjs';
import { extractText } from './extract.mjs';
import { writeArticle, writeExplainer } from './llm.mjs';
import { findImage } from './images.mjs';
import { saveCard } from './card.mjs';
import { categoryBySlug } from '../site.config.mjs';
import { POSTS_DIR, STATE_FILE, ROOT, log, readJSON, writeJSON, slugify, similarity, fingerprint, loadPosts, sharedPhrases } from './util.mjs';

const CARD_CACHE = path.join(ROOT, '.cache', 'cards');

function uniqueSlug(base) {
  let slug = base || `story-${Date.now().toString(36)}`;
  let i = 2;
  while (fs.existsSync(path.join(POSTS_DIR, `${slug}.json`))) slug = `${base}-${i++}`;
  return slug;
}

function words(article) {
  return (article.sections || []).flatMap((s) => s.paragraphs || []).join(' ').split(/\s+/).length;
}

function articleText(a) {
  return [a.headline, a.standfirst, ...(a.keyPoints || []), ...(a.sections || []).flatMap((s) => [s.heading, ...(s.paragraphs || [])])].join(' ');
}

async function gatherTexts(cluster) {
  const texts = [];
  for (const it of cluster.items.slice(0, 3)) texts.push(await extractText(it.url));
  return texts;
}

export async function buildPost(cluster, article, type = 'news') {
  const cat = categoryBySlug[article.category] ? article.category : cluster.hint;
  const image = await findImage(article.imageQuery || cluster.title, `${categoryBySlug[cat].label} ${article.tags?.[0] || ''}`.trim(), article.imageAlt || article.imageQuery || article.headline);
  const now = new Date().toISOString();
  const sources = [];
  for (const it of cluster.items) {
    if (!sources.some((s) => s.name === it.source)) sources.push({ name: it.source, url: it.url });
    if (sources.length >= 4) break;
  }
  return {
    slug: uniqueSlug(slugify(article.headline)),
    status: env.REQUIRE_REVIEW ? 'draft' : 'published',
    type,
    category: cat,
    region: article.region || 'Global',
    headline: article.headline.trim(),
    standfirst: article.standfirst?.trim() || '',
    keyPoints: (article.keyPoints || []).slice(0, 5),
    sections: (article.sections || []).map((s) => ({ heading: s.heading || '', paragraphs: (s.paragraphs || []).filter(Boolean) })),
    highlight: article.highlight || '',
    timeline: Array.isArray(article.timeline) ? article.timeline.slice(0, 8) : [],
    tags: (article.tags || []).slice(0, 6),
    socialSummary: article.socialSummary || article.standfirst || '',
    image,
    sources,
    sourceTitles: cluster.items.map((i) => i.title).slice(0, 6),
    sourceCount: cluster.sourceCount,
    importance: Math.min(10, Math.max(1, Number(article.importance) || 5)),
    breaking: type === 'news' && !!article.breaking && cluster.sourceCount >= 3,
    publishedAt: now,
    updatedAt: now,
    readingMinutes: Math.max(2, Math.round(words(article) / 220)),
    facebook: null,
  };
}

async function main() {
  fs.mkdirSync(POSTS_DIR, { recursive: true });
  const state = readJSON(STATE_FILE, { urls: {}, fps: {} });
  const weekAgo = Date.now() - 7 * 864e5;
  for (const k of ['urls', 'fps']) for (const [key, t] of Object.entries(state[k])) if (t < weekAgo) delete state[k][key];

  const recent = loadPosts().filter((p) => Date.now() - new Date(p.publishedAt) < 72 * 36e5);
  const recentTitles = recent.flatMap((p) => [p.headline, ...(p.sourceTitles || [])]);

  log('collecting feeds…');
  const items = (await collectItems()).filter((it) => !state.urls[it.url]);
  log(`${items.length} new items`);
  const clusters = clusterItems(items).filter((c) => !state.fps[fingerprint(c.title)] && !recentTitles.some((t) => similarity(t, c.title) >= 0.5));
  log(`${clusters.length} candidate stories`);

  // Prefer stories covered by several outlets; keep categories varied within a run.
  const picked = [];
  const usedCats = new Set();
  const pool = [...clusters.filter((c) => c.sourceCount >= 2), ...clusters.filter((c) => c.sourceCount < 2)];
  for (const c of pool) {
    if (picked.length >= env.MAX_STORIES_PER_RUN) break;
    if (usedCats.has(c.hint) && pool.length > env.MAX_STORIES_PER_RUN * 2) continue;
    picked.push(c);
    usedCats.add(c.hint);
  }

  const published = [];
  for (const cluster of picked) {
    log(`writing: ${cluster.title} (${cluster.sourceCount} sources)`);
    const texts = await gatherTexts(cluster);
    const sourceTexts = [...texts, ...cluster.items.map((i) => `${i.title} ${i.summary}`)];
    let article = await writeArticle(cluster, texts);
    if (article && sharedPhrases(articleText(article), sourceTexts) > 3) {
      log('  too close to source wording — rewriting');
      article = await writeArticle(cluster, texts, 'Your previous draft reused source wording. Rewrite every sentence in fresh words and a different structure.');
      if (article && sharedPhrases(articleText(article), sourceTexts) > 6) article = null;
    }
    cluster.items.forEach((i) => (state.urls[i.url] = Date.now()));
    state.fps[fingerprint(cluster.title)] = Date.now();
    if (!article) { log('  skipped'); continue; }

    const post = await buildPost(cluster, article);
    if (!env.DRY_RUN) writeJSON(path.join(POSTS_DIR, `${post.slug}.json`), post);
    try { await saveCard(post, CARD_CACHE); } catch (e) { log('  card render failed:', e.message); }
    published.push({ post, cluster, texts });
    log(`  ✓ ${post.status}: /news/${post.slug}/ [${post.category}] image: ${post.image?.provider || 'none'}`);
  }

  // One "Explained" piece per day about the most widely covered story.
  const today = new Date().toISOString().slice(0, 10);
  const hasExplainer = loadPosts().some((p) => p.type === 'explainer' && p.publishedAt?.startsWith(today));
  if (env.DAILY_EXPLAINER && !hasExplainer && published.length) {
    const top = [...published].sort((a, b) => b.cluster.sourceCount - a.cluster.sourceCount)[0];
    log(`writing explainer for: ${top.cluster.title}`);
    const ex = await writeExplainer(top.cluster, top.texts);
    if (ex) {
      const post = await buildPost(top.cluster, ex, 'explainer');
      if (!env.DRY_RUN) writeJSON(path.join(POSTS_DIR, `${post.slug}.json`), post);
      try { await saveCard(post, CARD_CACHE); } catch {}
      log(`  ✓ explainer: /news/${post.slug}/`);
    }
  }

  if (!env.DRY_RUN) writeJSON(STATE_FILE, state);
  log(`done — ${published.length} stories`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

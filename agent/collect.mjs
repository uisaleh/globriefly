import Parser from 'rss-parser';
import { feeds, env } from './config.mjs';
import { log, similarity, UA } from './util.mjs';

const parser = new Parser({ timeout: 15000, headers: { 'User-Agent': UA } });

// Pull every feed, keep recent items.
export async function collectItems() {
  const cutoff = Date.now() - env.MAX_ITEM_AGE_HOURS * 36e5;
  const results = await Promise.allSettled(feeds.map(async (f) => {
    const feed = await parser.parseURL(f.url);
    return (feed.items || []).map((it) => ({
      source: f.name,
      hint: f.hint,
      title: (it.title || '').trim(),
      url: it.link,
      summary: (it.contentSnippet || it.summary || it.content || '').replace(/\s+/g, ' ').trim().slice(0, 600),
      date: new Date(it.isoDate || it.pubDate || Date.now()).getTime(),
    }));
  }));
  const items = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') items.push(...r.value);
    else log(`feed failed: ${feeds[i].name} ${feeds[i].url} — ${r.reason?.message}`);
  });
  return items.filter((it) => it.title && it.url && it.date >= cutoff && !/^(watch|listen|video|podcast|live:)/i.test(it.title));
}

// Group items about the same story across outlets.
export function clusterItems(items) {
  const clusters = [];
  for (const it of items.sort((a, b) => b.date - a.date)) {
    let best = null, bestScore = 0;
    for (const c of clusters) {
      const s = similarity(it.title, c.items[0].title);
      if (s > bestScore) { best = c; bestScore = s; }
    }
    if (best && bestScore >= 0.5) best.items.push(it);
    else clusters.push({ items: [it] });
  }
  const now = Date.now();
  for (const c of clusters) {
    const sources = new Set(c.items.map((i) => i.source));
    c.sourceCount = sources.size;
    c.newest = Math.max(...c.items.map((i) => i.date));
    const hours = (now - c.newest) / 36e5;
    c.score = c.sourceCount * 3 - hours;
    const hints = {};
    c.items.forEach((i) => (hints[i.hint] = (hints[i.hint] || 0) + 1));
    c.hint = Object.entries(hints).sort((a, b) => b[1] - a[1])[0][0];
    c.title = c.items[0].title;
  }
  return clusters.sort((a, b) => b.score - a.score);
}

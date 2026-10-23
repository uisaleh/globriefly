// Collects recent news videos from official YouTube channels (public RSS, no API key).
// Videos are never downloaded or re-hosted: the site shows them in YouTube's own embedded player,
// which channel owners allow through YouTube's embed feature. Output: content/videos.json
import fs from 'node:fs';
import path from 'node:path';
import Parser from 'rss-parser';
import { ROOT, log, withDeadline, similarity } from './util.mjs';

export const videoChannels = [
  { name: 'BBC News', id: 'UC16niRr50-MSBwiO3YDb3RA' },
  { name: 'Al Jazeera English', id: 'UCNye-wNBqNL5ZzHSJj3l8Bg' },
  { name: 'DW News', id: 'UCknLrEdhRCp1aegoMqRaCZg' },
  { name: 'FRANCE 24 English', id: 'UCQfwfsi5VrQ8yKZ-UWmAEFg' },
  { name: 'Sky News', id: 'UCoMdktPbSTixAyNGwb-UYkQ' },
  { name: 'Reuters', id: 'UChqUTb7kYRX8-EiaN3XFrSQ' },
  { name: 'Associated Press', id: 'UC52X5wxOL_s5yw0dQk7NtgA' },
];

const OUT = path.join(ROOT, 'content', 'videos.json');
const SKIP = /#shorts|\bshorts?\b|live:|🔴|livestream|live stream|24\/7|full episode|podcast/i;
// "Title | BBC News", "Title #BBCNews", "Title | The Wrap" → "Title"
const cleanTitle = (t = '') => t.replace(/(\s+#\w+)+\s*$/g, '').replace(/\s+[|–—-]\s+[^|–—-]{2,40}$/, '').replace(/\s+#\w+/g, '').trim();
const parser = new Parser({ timeout: 15000, customFields: { item: [['yt:videoId', 'videoId'], ['media:group', 'media']] } });

// YouTube's public feeds sometimes answer 404/500 at random, so try a few times and
// also the channel's uploads playlist (UC… → UU…), which serves the same videos.
async function fetchFeed(id) {
  const urls = [
    `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`,
    `https://www.youtube.com/feeds/videos.xml?playlist_id=UU${id.slice(2)}`,
  ];
  let last;
  for (let attempt = 0; attempt < 4; attempt++) {
    for (const u of urls) {
      try { return await parser.parseURL(u); } catch (e) { last = e; }
    }
    await new Promise((r) => setTimeout(r, 2500 * (attempt + 1)));
  }
  throw last;
}

export async function collectVideos({ max = 24, perChannel = 5, maxAgeHours = 72 } = {}) {
  const cutoff = Date.now() - maxAgeHours * 36e5;
  // One channel at a time: YouTube refuses bursts of parallel feed requests.
  const lists = [];
  for (const ch of videoChannels) lists.push(await (async () => {
    try {
      const feed = await fetchFeed(ch.id);
      const items = feed.items
        .map((it) => ({
          id: it.videoId || (it.link || '').split('v=')[1],
          title: cleanTitle(it.title || ''),
          channel: ch.name,
          channelUrl: `https://www.youtube.com/channel/${ch.id}`,
          publishedAt: new Date(it.pubDate || it.isoDate).toISOString(),
          description: String(it.media?.['media:description']?.[0] || '').split('\n')[0].slice(0, 220),
        }))
        .filter((v) => v.id && v.title && !SKIP.test(v.title) && new Date(v.publishedAt) >= cutoff && !/\/shorts\//.test(v.link || ''))
        .slice(0, perChannel);
      log(`  video feed ${ch.name}: ${feed.items.length} in feed, ${items.length} kept`);
      return items;
    } catch (e) {
      log(`  video feed ${ch.name} failed: ${e.message}`);
      return [];
    }
  })());
  // Interleave channels so one channel never fills the section, newest first within each round.
  const out = [];
  for (let i = 0; i < perChannel; i++) for (const l of lists) if (l[i]) out.push(l[i]);
  const seen = new Set();
  return out.filter((v) => !seen.has(v.id) && seen.add(v.id)).slice(0, max);
}

export async function updateVideos() {
  const fresh = (await withDeadline(collectVideos(), 150000, [])) || [];
  // Keep earlier videos (still within 72 h) so channels that fail this run stay in the mix.
  let prev = [];
  try { prev = JSON.parse(fs.readFileSync(OUT, 'utf8')).videos || []; } catch {}
  const cutoff = Date.now() - 72 * 36e5;
  const byId = new Map();
  for (const v of [...fresh, ...prev]) {
    if (byId.has(v.id) || new Date(v.publishedAt) < cutoff) continue;
    v.title = cleanTitle(v.title);
    // One video per topic: skip near-duplicates from other channels (e.g. three clips of the same earthquake).
    if ([...byId.values()].some((x) => similarity(x.title, v.title) >= 0.35)) continue;
    byId.set(v.id, v);
  }
  const all = [...byId.values()].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  // Interleave channels again so the top of the list mixes broadcasters.
  const groups = {};
  all.forEach((v) => (groups[v.channel] ||= []).push(v));
  const videos = [];
  for (let i = 0; videos.length < all.length; i++) for (const g of Object.values(groups)) if (g[i]) videos.push(g[i]);
  if (!videos.length) { log('videos: none collected, keeping previous list'); return 0; }
  videos.splice(24);
  fs.writeFileSync(OUT, JSON.stringify({ updatedAt: new Date().toISOString(), videos }, null, 2) + '\n');
  log(`videos: saved ${videos.length}`);
  return videos.length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await updateVideos();
  process.exit(0);
}

// Collects recent news videos from official YouTube channels (public RSS, no API key).
// Videos are never downloaded or re-hosted: the site shows them in YouTube's own embedded player,
// which channel owners allow through YouTube's embed feature. Output: content/videos.json
import fs from 'node:fs';
import path from 'node:path';
import Parser from 'rss-parser';
import { ROOT, log, withDeadline } from './util.mjs';

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
const parser = new Parser({ timeout: 15000, customFields: { item: [['yt:videoId', 'videoId'], ['media:group', 'media']] } });

export async function collectVideos({ max = 24, perChannel = 5, maxAgeHours = 72 } = {}) {
  const cutoff = Date.now() - maxAgeHours * 36e5;
  const lists = await Promise.all(videoChannels.map(async (ch) => {
    try {
      const feed = await parser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`);
      const items = feed.items
        .map((it) => ({
          id: it.videoId || (it.link || '').split('v=')[1],
          title: (it.title || '').trim(),
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
  }));
  // Interleave channels so one channel never fills the section, newest first within each round.
  const out = [];
  for (let i = 0; i < perChannel; i++) for (const l of lists) if (l[i]) out.push(l[i]);
  const seen = new Set();
  return out.filter((v) => !seen.has(v.id) && seen.add(v.id)).slice(0, max);
}

export async function updateVideos() {
  const videos = await withDeadline(collectVideos(), 60000, []);
  if (!videos?.length) { log('videos: none collected, keeping previous list'); return 0; }
  fs.writeFileSync(OUT, JSON.stringify({ updatedAt: new Date().toISOString(), videos }, null, 2) + '\n');
  log(`videos: saved ${videos.length}`);
  return videos.length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await updateVideos();
  process.exit(0);
}

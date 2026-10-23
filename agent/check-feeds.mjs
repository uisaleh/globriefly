// Tests every current + candidate feed: reachable? how many items in the last 48 h?
// Writes content/state/feeds-report.json and a readable content/state/feeds-report.txt.
import fs from 'node:fs';
import path from 'node:path';
import Parser from 'rss-parser';
import { feeds } from './config.mjs';
import { candidates } from './feed-candidates.mjs';
import { ROOT, UA } from './util.mjs';

const parser = new Parser({ timeout: 20000, headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/xml, text/xml, */*' } });
const all = [...feeds.map((f) => ({ ...f, current: true })), ...candidates.filter((c) => !feeds.some((f) => f.url === c.url))];
const cutoff = Date.now() - 48 * 36e5;
const results = await Promise.all(all.map(async (f) => {
  try {
    const feed = await parser.parseURL(f.url);
    const items = feed.items || [];
    const fresh = items.filter((it) => new Date(it.isoDate || it.pubDate || 0).getTime() >= cutoff).length;
    const withText = items.filter((it) => (it.contentSnippet || it.summary || '').length > 80).length;
    return { ...f, ok: true, items: items.length, fresh, withText };
  } catch (e) {
    return { ...f, ok: false, error: e.message.slice(0, 120) };
  }
}));
const dir = path.join(ROOT, 'content', 'state');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'feeds-report.json'), JSON.stringify(results, null, 2) + '\n');
const lines = results.map((r) => `${r.ok ? (r.fresh ? '✓' : '·') : '✗'} ${r.current ? '[current]' : '[new]    '} ${r.hint.padEnd(13)} ${r.name.padEnd(26)} ${r.ok ? `${r.fresh} fresh / ${r.items} items, ${r.withText} with summary` : r.error}  ${r.url}`);
fs.writeFileSync(path.join(dir, 'feeds-report.txt'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
process.exit(0);

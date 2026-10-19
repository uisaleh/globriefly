import { getAllPosts } from '@/lib/posts';
import { site } from '@/site.config.mjs';

export const dynamic = 'force-static';

const esc = (s = '') => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function GET() {
  const items = getAllPosts().slice(0, 50).map((p) => `
    <item>
      <title>${esc(p.headline)}</title>
      <link>${site.url}/news/${p.slug}/</link>
      <guid>${site.url}/news/${p.slug}/</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
      <category>${esc(p.cat.label)}</category>
      <description>${esc(p.standfirst)}</description>
    </item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>${site.name}</title>
  <link>${site.url}</link>
  <description>${esc(site.description)}</description>
  <language>en</language>${items}
</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}

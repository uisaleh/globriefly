import { getAllPosts } from '@/lib/posts';
import { site } from '@/site.config.mjs';

export const dynamic = 'force-static';

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function GET() {
  const posts = getAllPosts().slice(0, 50);
  const abs = (u) => (u?.startsWith('http') ? u : site.url + u);
  const items = posts.map((p) => {
    const url = `${site.url}/news/${p.slug}/`;
    const img = p.ogImage ? abs(p.ogImage) : p.image?.src;
    const type = img?.endsWith('.png') ? 'image/png' : 'image/jpeg';
    return `
    <item>
      <title>${esc(p.headline)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
      <dc:creator>Globriefly ${esc(p.cat.label)} Desk</dc:creator>
      <category>${esc(p.cat.label)}</category>
      <description>${esc(p.standfirst)}</description>${img ? `
      <media:content url="${esc(img)}" medium="image" type="${type}" />
      <media:thumbnail url="${esc(img)}" />` : ''}
    </item>`;
  }).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
  <title>${esc(site.name)} — ${esc(site.tagline)}</title>
  <link>${site.url}/</link>
  <atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml" />
  <description>${esc(site.description)}</description>
  <language>en</language>
  <lastBuildDate>${new Date(posts[0]?.publishedAt || Date.now()).toUTCString()}</lastBuildDate>
  <ttl>60</ttl>
  <image>
    <url>${site.url}/logo.png</url>
    <title>${esc(site.name)} — ${esc(site.tagline)}</title>
    <link>${site.url}/</link>
  </image>${items}
</channel>
</rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}

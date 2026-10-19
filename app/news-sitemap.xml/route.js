import { getAllPosts } from '@/lib/posts';
import { site } from '@/site.config.mjs';

export const dynamic = 'force-static';

const esc = (s = '') => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Google News sitemap: stories from the last 48 hours (Google's rule), so new articles are found within minutes.
export function GET() {
  const cutoff = Date.now() - 48 * 36e5;
  let recent = getAllPosts().filter((p) => new Date(p.publishedAt).getTime() >= cutoff);
  if (!recent.length) recent = getAllPosts().slice(0, 20);
  const items = recent.slice(0, 1000).map((p) => `
  <url>
    <loc>${site.url}/news/${p.slug}/</loc>
    <news:news>
      <news:publication><news:name>${esc(site.name)}</news:name><news:language>en</news:language></news:publication>
      <news:publication_date>${new Date(p.publishedAt).toISOString()}</news:publication_date>
      <news:title>${esc(p.headline)}</news:title>
    </news:news>${p.image?.src ? `
    <image:image><image:loc>${esc(p.image.src.startsWith('http') ? p.image.src : site.url + p.image.src)}</image:loc></image:image>` : ''}
  </url>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${items}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

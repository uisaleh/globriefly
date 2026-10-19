import { getAllPosts, allTags, byCategory, pageCount } from '@/lib/posts';
import { site, categories } from '@/site.config.mjs';

export const dynamic = 'force-static';

const STATIC = ['about', 'editorial-standards', 'corrections', 'contact', 'advertise', 'privacy', 'cookies', 'terms', 'site-map', 'archive'];

export default function sitemap() {
  const posts = getAllPosts();
  const newest = posts[0]?.publishedAt;
  const abs = (s) => (s.startsWith('http') ? s : site.url + s);
  return [
    { url: `${site.url}/`, lastModified: newest, changeFrequency: 'hourly', priority: 1 },
    ...categories.flatMap((c) => {
      const list = byCategory(c.slug);
      const pages = pageCount(list);
      return [
        { url: `${site.url}/${c.slug}/`, lastModified: list[0]?.publishedAt, changeFrequency: 'hourly', priority: 0.9 },
        ...Array.from({ length: pages - 1 }, (_, i) => ({ url: `${site.url}/${c.slug}/page/${i + 2}/`, changeFrequency: 'daily', priority: 0.4 })),
      ];
    }),
    ...Array.from({ length: pageCount(posts) - 1 }, (_, i) => ({ url: `${site.url}/archive/page/${i + 2}/`, changeFrequency: 'daily', priority: 0.3 })),
    ...posts.map((p) => ({
      url: `${site.url}/news/${p.slug}/`,
      lastModified: p.updatedAt || p.publishedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
      ...(p.image?.src ? { images: [abs(p.image.src)] } : {}),
    })),
    ...allTags().filter((t) => t.posts.length >= 2).map((t) => ({ url: `${site.url}/tag/${t.slug}/`, lastModified: t.posts[0].publishedAt, changeFrequency: 'daily', priority: 0.5 })),
    ...STATIC.map((s) => ({ url: `${site.url}/${s}/`, changeFrequency: 'monthly', priority: 0.3 })),
  ];
}

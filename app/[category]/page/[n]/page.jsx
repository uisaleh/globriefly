import { notFound } from 'next/navigation';
import { categories, categoryBySlug } from '@/site.config.mjs';
import { byCategory, pageCount, pageOf } from '@/lib/posts';
import Listing from '@/components/Listing';

export const dynamicParams = false;

export function generateStaticParams() {
  const params = categories.flatMap((c) => {
    const pages = pageCount(byCategory(c.slug));
    return Array.from({ length: pages - 1 }, (_, i) => ({ category: c.slug, n: String(i + 2) }));
  });
  // Static export needs at least one path; an empty page 2 is marked noindex below.
  return params.length ? params : [{ category: 'world', n: '2' }];
}

export async function generateMetadata({ params }) {
  const { category, n } = await params;
  const cat = categoryBySlug[category];
  const empty = byCategory(category).length <= (Number(n) - 1) * 30;
  return {
    title: `${cat.label} news — page ${n}`,
    alternates: { canonical: `/${category}/page/${n}/` },
    robots: empty ? { index: false, follow: true } : undefined,
  };
}

export default async function CategoryArchive({ params }) {
  const { category, n } = await params;
  const cat = categoryBySlug[category];
  if (!cat) notFound();
  const all = byCategory(category);
  const page = Number(n);
  return <Listing title={cat.label} kicker="Globriefly" color={cat.color} posts={pageOf(all, page)} page={page} pages={pageCount(all)} basePath={`/${category}/`} active={category} />;
}

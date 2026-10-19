import { notFound } from 'next/navigation';
import { allTags, getTag, pageCount, pageOf } from '@/lib/posts';
import Listing from '@/components/Listing';

export const dynamicParams = false;

export function generateStaticParams() {
  const tags = allTags().map((t) => ({ tag: t.slug }));
  return tags.length ? tags : [{ tag: 'news' }];
}

export async function generateMetadata({ params }) {
  const { tag } = await params;
  const t = getTag(tag);
  if (!t) return { robots: { index: false } };
  return {
    title: `${t.name} — latest news`,
    description: `The latest news and analysis about ${t.name} from Globriefly.`,
    alternates: { canonical: `/tag/${t.slug}/` },
    // Thin tag pages (one story) stay out of search results but still pass links.
    robots: t.posts.length < 2 ? { index: false, follow: true } : undefined,
  };
}

export default async function TagPage({ params }) {
  const { tag } = await params;
  const t = getTag(tag);
  if (!t) notFound();
  return <Listing title={t.name} kicker="Topic" intro={`All Globriefly stories about ${t.name}.`} posts={t.posts.slice(0, 60)} page={1} pages={1} basePath={`/tag/${t.slug}/`} />;
}

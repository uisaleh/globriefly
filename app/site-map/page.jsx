import Link from 'next/link';
import StaticPage from '@/components/StaticPage';
import { categories } from '@/site.config.mjs';
import { getAllPosts, allTags } from '@/lib/posts';

export const metadata = { title: 'Site map', description: 'Every section and page on Globriefly.', alternates: { canonical: '/site-map/' } };

const pages = [
  ['Top stories', '/'], ['All stories', '/archive/'], ['About', '/about/'], ['Editorial standards', '/editorial-standards/'],
  ['Corrections', '/corrections/'], ['Contact', '/contact/'], ['Advertise', '/advertise/'], ['Privacy policy', '/privacy/'],
  ['Cookie policy', '/cookies/'], ['Terms of use', '/terms/'], ['RSS feed', '/rss.xml'], ['XML sitemap', '/sitemap.xml'],
];

export default function SiteMap() {
  const latest = getAllPosts().slice(0, 30);
  const topics = allTags().filter((t) => t.posts.length >= 2).slice(0, 60);
  const listStyle = { margin: 0, paddingLeft: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '6px 24px', fontFamily: 'var(--font-sans)', fontSize: 16 };
  return (
    <StaticPage title="Site map">
      <h2>Sections</h2>
      <ul style={listStyle}>{categories.map((c) => <li key={c.slug}><Link href={`/${c.slug}/`} style={{ textDecoration: 'underline' }}>{c.label}</Link></li>)}</ul>
      <h2>Pages</h2>
      <ul style={listStyle}>{pages.map(([label, href]) => <li key={href}><Link href={href} style={{ textDecoration: 'underline' }}>{label}</Link></li>)}</ul>
      {topics.length > 0 && (<>
        <h2>Topics</h2>
        <ul style={listStyle}>{topics.map((t) => <li key={t.slug}><Link href={`/tag/${t.slug}/`} style={{ textDecoration: 'underline' }}>{t.name}</Link></li>)}</ul>
      </>)}
      <h2>Latest stories</h2>
      <ul style={{ ...listStyle, gridTemplateColumns: '1fr' }}>{latest.map((p) => <li key={p.slug}><Link href={`/news/${p.slug}/`} style={{ textDecoration: 'underline' }}>{p.headline}</Link></li>)}</ul>
      <p><Link href="/archive/" style={{ textDecoration: 'underline' }}>See every story in the archive</Link></p>
    </StaticPage>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { categories, categoryBySlug } from '@/site.config.mjs';
import { byCategory, PAGE_SIZE, hasImage } from '@/lib/posts';
import { Header, Footer, Thumb, Card, Newsletter } from '@/components/ui';
import TimeAgo from '@/components/TimeAgo';

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }) {
  const { category } = await params;
  const cat = categoryBySlug[category];
  if (!cat) return {};
  return {
    title: `${cat.label} news`,
    description: `The latest ${cat.label.toLowerCase()} news from around the world, updated every hour.`,
    alternates: { canonical: `/${cat.slug}/` },
  };
}

export default async function CategoryPage({ params }) {
  const { category } = await params;
  const cat = categoryBySlug[category];
  if (!cat) notFound();
  const everything = byCategory(cat.slug);
  const posts = everything.slice(0, PAGE_SIZE);
  // Photos lead the page; stories without a photo are listed as headlines underneath.
  const pictured = posts.filter(hasImage);
  const headlines = posts.filter((p) => !hasImage(p));
  const lead = pictured[0] || headlines.shift();
  const rest = pictured.slice(1);
  const side = rest.slice(0, 4);
  const grid = rest.slice(4);

  return (
    <>
      <Header active={cat.slug} />
      <main className="wrap" style={{ paddingBottom: 72 }}>
        <div className="cat-head" style={{ borderBottomColor: cat.color }}>
          <span className="kicker" style={{ color: cat.color }}>Globriefly</span>
          <h1>{cat.label}</h1>
        </div>
        {!lead && <p className="standfirst">New {cat.label.toLowerCase()} stories will appear here shortly.</p>}
        {lead && (
          <section className="hero" style={{ marginBottom: 56 }}>
            <Link href={`/news/${lead.slug}/`} className="hero-lead">
              <Thumb post={lead} ratio="r169" />
              <h2 className="hl" style={{ fontSize: 'clamp(28px, 3.6vw, 42px)', lineHeight: 1.06, fontWeight: 800, letterSpacing: '-0.025em' }}>{lead.headline}</h2>
              <p className="standfirst">{lead.standfirst}</p>
              <span className="meta"><TimeAgo iso={lead.publishedAt} /></span>
            </Link>
            {side.length > 0 && (
              <div className="side">
                {side.map((p) => (
                  <Link key={p.slug} href={`/news/${p.slug}/`} className="row-item">
                    <Thumb post={p} ratio="" />
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span className="t hl">{p.headline}</span>
                      <span className="meta"><TimeAgo iso={p.publishedAt} /></span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
        {grid.length > 0 && <div className="grid-cards" style={{ marginBottom: 40 }}>{grid.map((p) => <Card key={p.slug} post={p} />)}</div>}
        {headlines.length > 0 && (
          <section aria-label={`More ${cat.label} headlines`} style={{ marginBottom: 48 }}>
            <h2 className="side-title" style={{ borderBottom: `3px solid ${cat.color}`, paddingBottom: 10, marginBottom: 4 }}>More {cat.label} headlines</h2>
            <div className="headline-list">
              {headlines.map((p) => (
                <Link key={p.slug} href={`/news/${p.slug}/`}>
                  <span className="t hl">{p.headline}</span>
                  <span className="meta"><TimeAgo iso={p.publishedAt} /></span>
                </Link>
              ))}
            </div>
          </section>
        )}
        {everything.length > PAGE_SIZE && <Link href={`/${cat.slug}/page/2/`} rel="next" className="btn btn-dark" style={{ marginBottom: 64 }}>Older {cat.label.toLowerCase()} stories</Link>}
      </main>
      <Newsletter />
      <div style={{ height: 72 }} />
      <Footer />
    </>
  );
}

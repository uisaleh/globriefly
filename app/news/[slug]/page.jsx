import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPosts, getPost, related, trending, byCategory, formatDateTime, tagSlug } from '@/lib/posts';
import { site } from '@/site.config.mjs';
import { Header, Footer, Thumb, Kicker, Card } from '@/components/ui';

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const url = `/news/${post.slug}/`;
  const image = post.image?.src || '/og-default.png';
  return {
    title: post.headline,
    description: post.standfirst,
    alternates: { canonical: url },
    keywords: post.tags,
    openGraph: { type: 'article', url, title: post.headline, description: post.standfirst, images: [{ url: image, alt: post.image?.alt || post.headline }], publishedTime: post.publishedAt, modifiedTime: post.updatedAt || post.publishedAt, section: post.cat.label, tags: post.tags },
    twitter: { card: 'summary_large_image', title: post.headline, description: post.standfirst, images: image ? [image] : [] },
  };
}

function ShareIcon({ href, label, children }) {
  return <a href={href} aria-label={label} className="icon-btn" target="_blank" rel="noopener">{children}</a>;
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const url = `${site.url}/news/${post.slug}/`;
  const enc = encodeURIComponent(url);
  const rel = related(post, 3);
  const hot = trending(6).filter((p) => p.slug !== post.slug).slice(0, 5);
  const moreCat = byCategory(post.category).filter((p) => p.slug !== post.slug && !rel.includes(p)).slice(0, 4);
  const more = getAllPosts().filter((p) => p.slug !== post.slug && p.category !== post.category).slice(0, 4);
  const sections = post.sections || [];
  const half = Math.ceil(sections.length / 2);

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.headline,
    description: post.standfirst,
    image: [post.image?.src || '/og-default.png'].map((s) => (s.startsWith('http') ? s : site.url + s)),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    articleSection: post.cat.label,
    keywords: (post.tags || []).join(', '),
    author: { '@type': 'Organization', name: `${site.name} ${post.cat.label} Desk`, url: site.url },
    publisher: { '@type': 'NewsMediaOrganization', name: site.name, logo: { '@type': 'ImageObject', url: `${site.url}/logo.png` } },
    mainEntityOfPage: url,
    isAccessibleForFree: true,
  };
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${site.url}/` },
      { '@type': 'ListItem', position: 2, name: post.cat.label, item: `${site.url}/${post.category}/` },
      { '@type': 'ListItem', position: 3, name: post.headline, item: url },
    ],
  };

  const renderSection = (s, i) => (
    <div key={i} style={{ display: 'contents' }}>
      {s.heading ? <h2>{s.heading}</h2> : null}
      {(s.paragraphs || []).map((para, j) => <p key={j}>{para}</p>)}
    </div>
  );

  return (
    <>
      <Header active={post.category} />
      <div style={{ height: 4, width: '38%', background: 'var(--red)' }} aria-hidden="true" />
      <main className="wrap article-main">
        <article className="article" style={{ '--cat': post.cat.color }}>
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span>
            <Link href={`/${post.category}/`} style={{ color: post.cat.color, fontWeight: 700 }}>{post.cat.label}</Link>
          </nav>
          {post.breaking && <span className="live-tag" style={{ background: '#FDECEE', color: 'var(--red-text)', fontSize: 12 }}><span className="dot" style={{ background: 'var(--red-text)', margin: 0 }} />DEVELOPING STORY</span>}
          <h1>{post.headline}</h1>
          <p className="standfirst">{post.standfirst}</p>

          <div className="byline">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="avatar">G</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Globriefly {post.cat.label} Desk</span>
                <span className="meta">
                  Published {formatDateTime(post.publishedAt)}
                  {post.updatedAt && post.updatedAt !== post.publishedAt ? ` · Updated ${formatDateTime(post.updatedAt)}` : ''}
                  {' · '}{post.readingMinutes || 5} min read
                </span>
              </span>
            </div>
            <div className="share">
              <ShareIcon href={`https://www.facebook.com/sharer/sharer.php?u=${enc}`} label="Share on Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V9H6.5v3.5H9V21h3.5v-8.5H15l.5-3.5h-3V7a1 1 0 0 1 1-1H15z" /></svg>
              </ShareIcon>
              <ShareIcon href={`https://twitter.com/intent/tweet?url=${enc}&text=${encodeURIComponent(post.headline)}`} label="Share on X">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M4 4l16 16M20 4L4 20" /></svg>
              </ShareIcon>
              <ShareIcon href={`https://wa.me/?text=${encodeURIComponent(post.headline + ' ' + url)}`} label="Share on WhatsApp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" /></svg>
              </ShareIcon>
              <ShareIcon href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc}`} label="Share on LinkedIn">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M7 10v7M7 7v.01M11 17v-4a3 3 0 0 1 6 0v4M11 10v7" /></svg>
              </ShareIcon>
            </div>
          </div>

          {post.image?.src && (
            <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <img src={post.image.src} alt={post.image.alt || post.headline} className="thumb r169" fetchPriority="high" />
              <figcaption className="credit" style={{ fontSize: 13, lineHeight: 1.45 }}>
                {post.image.alt ? `${post.image.alt}. ` : ''}
                {post.image.creditUrl ? <a href={post.image.creditUrl} rel="noopener" target="_blank" style={{ textDecoration: 'underline' }}>{post.image.credit}</a> : post.image.credit}
                {post.image.license ? ` · ${post.image.license}` : ''}
              </figcaption>
            </figure>
          )}

          {post.keyPoints?.length > 0 && (
            <section className="keypoints" aria-label="Key points">
              <h2>KEY POINTS</h2>
              <ul>{post.keyPoints.map((k, i) => <li key={i}>{k}</li>)}</ul>
            </section>
          )}

          <div className="body">
            {sections.slice(0, half).map(renderSection)}
            {post.highlight && <blockquote className="highlight">{post.highlight}</blockquote>}
          </div>

          {post.timeline?.length > 0 && (
            <section className="timeline" aria-label="Timeline">
              <h2 style={{ color: post.cat.color }}>HOW WE GOT HERE</h2>
              <ol>{post.timeline.map((t, i) => <li key={i}><span className="when">{t.when}</span><span className="what">{t.what}</span></li>)}</ol>
            </section>
          )}

          {sections.length > half && <div className="body">{sections.slice(half).map(renderSection)}</div>}

          {post.sources?.length > 0 && (
            <p className="sources">
              Additional reporting from{' '}
              {post.sources.map((s, i) => (
                <span key={s.url}>
                  <a href={s.url} rel="noopener nofollow" target="_blank">{s.name}</a>
                  {i < post.sources.length - 2 ? ', ' : i === post.sources.length - 2 ? ' and ' : ''}
                </span>
              ))}.
            </p>
          )}

          {post.tags?.length > 0 && (
            <nav className="tags" aria-label="Topics">{post.tags.map((t) => <Link key={t} href={`/tag/${tagSlug(t)}/`}>{t}</Link>)}</nav>
          )}

          {rel.length > 0 && (
            <section aria-label="Related coverage" style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 12 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', paddingBottom: 10, borderBottom: '3px solid var(--ink)' }}>Related coverage</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                {rel.map((p) => <Card key={p.slug} post={p} small showTime={false} />)}
              </div>
            </section>
          )}

          {moreCat.length > 0 && (
            <section aria-label={`More in ${post.cat.label}`} style={{ display: 'flex', flexDirection: 'column', paddingTop: 12 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', paddingBottom: 10, borderBottom: `3px solid ${post.cat.color}` }}>More in {post.cat.label}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', columnGap: 28 }}>
                {moreCat.map((p) => (
                  <Link key={p.slug} href={`/news/${p.slug}/`} className="row-item" style={{ gap: 14, padding: '16px 0' }}>
                    <Thumb post={p} ratio="" style={{ width: 104, height: 72, flexShrink: 0 }} />
                    <span className="t hl" style={{ fontSize: 16 }}>{p.headline}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="aside-box pattern-dark" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '24px 28px' }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 260px' }}>
              <span className="kicker" style={{ color: '#FF6B7A' }}>The morning brief</span>
              <span style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.15 }}>The world in five minutes, every morning.</span>
            </span>
            <a href="/#brief" className="btn" style={{ background: 'var(--red)', justifyContent: 'center', height: 48 }}>Subscribe free</a>
          </div>
        </article>

        <aside style={{ flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 36 }} aria-label="More stories">
          {hot.length > 0 && (
            <div className="side">
              <h2 className="side-title">Trending</h2>
              {hot.map((p, i) => (
                <Link key={p.slug} href={`/news/${p.slug}/`} className="num-item" style={{ padding: '14px 0' }}>
                  <span className="num" style={{ fontSize: 28 }}>{i + 1}</span>
                  <span className="t hl" style={{ fontSize: 16 }}>{p.headline}</span>
                </Link>
              ))}
            </div>
          )}
          <div className="ad-sticky">
            <span className="ad-label">Advertisement</span>
            {site.sidebarAd?.src ? (
              <iframe className="ad-frame" src={site.sidebarAd.src} title={site.sidebarAd.title} width="300" height="600" loading="lazy" scrolling="no" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" />
            ) : (
              <div className="ad-slot ad-tall">{/* Paste your AdSense 300×600 ad unit here */}</div>
            )}
          </div>
        </aside>
      </main>

      {more.length > 0 && (
        <section className="band-mist" aria-label="More from Globriefly">
          <div className="wrap">
            <div className="sec-head"><h2>More from Globriefly</h2></div>
            <div className="grid-cards">{more.map((p) => <Card key={p.slug} post={p} small />)}</div>
          </div>
        </section>
      )}
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([ld, crumbs]) }} />
    </>
  );
}

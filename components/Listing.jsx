import Link from 'next/link';
import { Header, Footer, Thumb, Kicker } from '@/components/ui';
import TimeAgo from '@/components/TimeAgo';

// Paginated list of stories, used by category archives, tag pages and the full archive.
export default function Listing({ title, kicker, color = 'var(--ink)', intro, posts, page, pages, basePath, active }) {
  const href = (n) => (n === 1 ? basePath : `${basePath}page/${n}/`);
  return (
    <>
      <Header active={active} />
      <main className="wrap" style={{ paddingBottom: 72 }}>
        <div className="cat-head" style={{ borderBottomColor: color }}>
          {kicker && <span className="kicker" style={{ color }}>{kicker}</span>}
          <h1>{title}{page > 1 ? ` — page ${page}` : ''}</h1>
          {intro && <p className="standfirst" style={{ marginTop: 10 }}>{intro}</p>}
        </div>
        {posts.length === 0 && <p className="standfirst">No stories here yet.</p>}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {posts.map((p) => (
            <Link key={p.slug} href={`/news/${p.slug}/`} className="row-item" style={{ gap: 20, padding: '20px 0' }}>
              <Thumb post={p} ratio="" style={{ width: 200, height: 125, flexShrink: 0 }} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                <Kicker post={p} />
                <span className="hl" style={{ fontSize: 21, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.01em' }}>{p.headline}</span>
                <span style={{ fontSize: 16, lineHeight: 1.45, color: 'var(--text-2)' }}>{p.standfirst}</span>
                <span className="meta"><TimeAgo iso={p.publishedAt} /></span>
              </span>
            </Link>
          ))}
        </div>
        {pages > 1 && (
          <nav aria-label="Pagination" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 40, alignItems: 'center' }}>
            {page > 1 && <Link href={href(page - 1)} rel="prev" className="btn btn-dark">Newer</Link>}
            {Array.from({ length: pages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 2)
              .map((n) => (
                <Link key={n} href={href(n)} aria-current={n === page ? 'page' : undefined} className="icon-btn" style={n === page ? { background: 'var(--ink)', color: '#fff', borderColor: 'var(--ink)', fontWeight: 800 } : { fontWeight: 700 }}>{n}</Link>
              ))}
            {page < pages && <Link href={href(page + 1)} rel="next" className="btn btn-dark">Older</Link>}
          </nav>
        )}
      </main>
      <Footer />
    </>
  );
}

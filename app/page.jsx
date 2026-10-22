import Link from 'next/link';
import { getAllPosts, byCategory, trending, hhmm, withImage, textFirst } from '@/lib/posts';
import { categoryBySlug } from '@/site.config.mjs';
import { Header, Footer, Thumb, Kicker, Card, SecHead, Newsletter } from '@/components/ui';
import TimeAgo from '@/components/TimeAgo';

export default function Home() {
  const posts = getAllPosts();
  const news = posts.filter((p) => p.type !== 'explainer');
  const used = new Set();
  const take = (list, n) => {
    const out = [];
    for (const p of list) {
      if (out.length >= n) break;
      if (!used.has(p.slug)) { out.push(p); used.add(p.slug); }
    }
    return out;
  };

  // Picture-led slots only use stories with a photo; headline-only slots take the photo-less stories first.
  const pictured = withImage(news);
  const lead = pictured.find((p) => (p.importance || 0) >= 7) || pictured[0] || news[0];
  if (lead) used.add(lead.slug);
  const breaking = news.find((p) => p.breaking && Date.now() - new Date(p.publishedAt) < 12 * 36e5);
  const top = take(textFirst(news), 5);
  const latest = take(pictured, 6);
  const updates = news.slice(0, 6);
  const blocks = ['business', 'technology'].map((slug) => {
    const all = byCategory(slug);
    const [first] = take(withImage(all), 1);
    return { cat: categoryBySlug[slug], first, rest: take(textFirst(all), first ? 3 : 4) };
  }).filter((b) => b.first || b.rest.length);
  const pics = take(pictured, 5);
  const regionNames = ['Asia', 'Europe', 'Americas', 'Africa', 'Middle East'];
  const regions = regionNames.map((r) => ({ name: r, items: textFirst(news.filter((p) => p.region === r)).slice(0, 3) })).filter((r) => r.items.length);
  const hot = trending(10);
  const explained = posts.filter((p) => p.type === 'explainer').slice(0, 3);
  const sh = withImage(news.filter((p) => p.category === 'science' || p.category === 'health'));
  const shFeature = sh.find((p) => !used.has(p.slug));
  if (shFeature) used.add(shFeature.slug);
  const shSide = take(sh, 4);
  const strip = take(withImage(news.filter((p) => p.category === 'sports' || p.category === 'entertainment')), 4);
  const textCols = ['politics', 'world', 'business'].map((slug) => {
    const all = textFirst(byCategory(slug));
    const fresh = take(all, 4);
    return { cat: categoryBySlug[slug], items: fresh.length >= 2 ? fresh : all.slice(0, 4) };
  }).filter((c) => c.items.length);

  return (
    <>
      <Header breaking={breaking} />
      <main className="home">
        {lead && (
          <section className="wrap hero">
            <Link href={`/news/${lead.slug}/`} className="hero-lead">
              <Thumb post={lead} ratio="r169" />
              <Kicker post={lead} />
              <h1 className="hl">{lead.headline}</h1>
              <p className="standfirst">{lead.standfirst}</p>
              <span className="meta">Globriefly {lead.cat.label} Desk · <TimeAgo iso={lead.publishedAt} /></span>
            </Link>
            {top.length > 0 && (
              <aside className="side" aria-label="Top stories">
                <h2 className="side-title" style={{ marginBottom: 8 }}>Top stories</h2>
                {top.map((p, i) => (
                  <Link key={p.slug} href={`/news/${p.slug}/`} className="num-item">
                    <span className="num">{i + 1}</span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Kicker post={p} />
                      <span className="t hl">{p.headline}</span>
                      <span className="meta"><TimeAgo iso={p.publishedAt} /></span>
                    </span>
                  </Link>
                ))}
              </aside>
            )}
          </section>
        )}

        {latest.length > 0 && (
          <section className="wrap">
            <SecHead title="Latest" href="/world/" />
            <div className="grid-cards">{latest.map((p) => <Card key={p.slug} post={p} />)}</div>
          </section>
        )}

        {updates.length > 2 && (
          <section className="band-live pattern-red" aria-label="Latest updates">
            <div className="wrap">
              <div className="live-intro">
                <span className="live-tag"><span className="dot" style={{ background: '#fff', margin: 0 }} />LIVE</span>
                <h2>As it happens: the latest from around the world</h2>
                <p className="standfirst" style={{ fontSize: 18 }}>Every new story the moment it is published, newest first.</p>
              </div>
              <ol className="live-list">
                {updates.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/news/${p.slug}/`}>
                      <span className="time">{hhmm(p.publishedAt)}</span>
                      <span><span className="t hl">{p.headline}</span><span className="s">{p.standfirst}</span></span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {blocks.length > 0 && (
          <section className="wrap blocks">
            {blocks.map(({ cat, first, rest }) => (
              <div key={cat.slug} style={{ display: 'flex', flexDirection: 'column' }}>
                <SecHead title={cat.label} href={`/${cat.slug}/`} linkText={`More ${cat.label}`} color={cat.color} />
                {first && (
                  <Link href={`/news/${first.slug}/`} className="block-lead" style={{ paddingTop: 0 }}>
                    <Thumb post={first} ratio="r21" />
                    <h3 className="hl">{first.headline}</h3>
                  </Link>
                )}
                {rest.map((p) => <Link key={p.slug} href={`/news/${p.slug}/`} className="list-link hl">{p.headline}</Link>)}
              </div>
            ))}
          </section>
        )}

        {pics.length >= 3 && (
          <section className="band-dark" aria-label="In pictures">
            <div className="wrap">
              <SecHead title="The day in pictures" />
              <div className="pics">
                <Link href={`/news/${pics[0].slug}/`} className="pics-main">
                  <Thumb post={pics[0]} ratio="r43" />
                  <span className="t">{pics[0].headline}</span>
                  <span className="credit">{pics[0].image?.credit}</span>
                </Link>
                <div className="pics-grid">
                  {pics.slice(1).map((p) => (
                    <Link key={p.slug} href={`/news/${p.slug}/`} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <Thumb post={p} ratio="r11" />
                      <span className="t">{p.headline}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {regions.length > 0 && (
          <section className="wrap">
            <SecHead title="Around the world" color="#2563A8" />
            <div className="regions">
              {regions.map((r) => (
                <div key={r.name}>
                  <h3>{r.name}</h3>
                  {r.items.map((p) => <Link key={p.slug} href={`/news/${p.slug}/`} className="hl">{p.headline}</Link>)}
                </div>
              ))}
            </div>
          </section>
        )}

        {hot.length >= 4 && (
          <section className="wrap">
            <SecHead title="Trending" />
            <ol className="mostread">
              {hot.map((p, i) => (
                <li key={p.slug}>
                  <Link href={`/news/${p.slug}/`}><span className="num">{i + 1}</span><span className="t hl">{p.headline}</span></Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        {explained.length > 0 && (
          <section className="band-mist pattern-light">
            <div className="wrap">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 28 }}>
                <span className="kicker" style={{ color: 'var(--red-text)' }}>Explained</span>
                <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.025em' }}>The big stories, made simple</h2>
              </div>
              <div className="explained">
                {explained.map((p) => (
                  <Link key={p.slug} href={`/news/${p.slug}/`} className="ex-card">
                    <span className="ex-q" style={{ background: p.cat.color }}>?</span>
                    <span className="t hl">{p.headline}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: p.cat.color }}>{p.cat.label} · {p.readingMinutes || 4} min read</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {shFeature && (
          <section className="wrap">
            <SecHead title="Science & Health" color="#4652C8" />
            <div className="feature">
              <Link href={`/news/${shFeature.slug}/`} className="feature-big" style={{ backgroundColor: shFeature.cat.color }}>
                <img src={shFeature.image.src} alt={shFeature.image.alt || shFeature.headline} loading="lazy" />
                <span className="feature-panel">
                  <span className="kicker" style={{ color: '#C9CEF5' }}>{shFeature.cat.label}</span>
                  <span className="t">{shFeature.headline}</span>
                  <span style={{ fontSize: 15, color: 'var(--on-dark)', lineHeight: 1.45 }}>{shFeature.standfirst}</span>
                </span>
              </Link>
              {shSide.length > 0 && (
                <div className="feature-side">
                  {shSide.map((p) => (
                    <Link key={p.slug} href={`/news/${p.slug}/`} className="row-item">
                      <Thumb post={p} ratio="" />
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><Kicker post={p} /><span className="t hl">{p.headline}</span></span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <Newsletter />

        {strip.length > 0 && (
          <section className="wrap">
            <SecHead title="Sports & Entertainment" />
            <div className="grid-cards">{strip.map((p) => <Card key={p.slug} post={p} ratio="r43" small showTime={false} />)}</div>
          </section>
        )}

        {textCols.length > 0 && (
          <section className="wrap textcols">
            {textCols.map(({ cat, items }) => (
              <div key={cat.slug}>
                <h2 style={{ borderBottomColor: cat.color }}>{cat.label}</h2>
                {items.map((p) => <Link key={p.slug} href={`/news/${p.slug}/`} className="hl">{p.headline}</Link>)}
              </div>
            ))}
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

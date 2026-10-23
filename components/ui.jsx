import Link from 'next/link';
import { site, categories } from '@/site.config.mjs';
import TimeAgo, { Today } from './TimeAgo';
import NewsletterForm from './NewsletterForm';

export function Logo({ dark = false, size = 30 }) {
  const ink = dark ? '#FFFFFF' : '#0E1116';
  return (
    <span className="logo">
      <svg width={size + 4} height={size + 4} viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="14" cy="16" r="11" fill="none" stroke={ink} strokeWidth="3" />
        <ellipse cx="14" cy="16" rx="4.5" ry="11" fill="none" stroke={ink} strokeWidth="2" />
        <rect x="9" y="13.5" width="23" height="5" rx="1" fill="#E5142B" />
      </svg>
      <span style={{ color: ink, fontSize: size }}>globriefly</span>
    </span>
  );
}

export function Header({ active, breaking }) {
  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <Today />
          <span><span className="dot" />Updated every hour</span>
        </div>
      </div>
      <header className="header">
        <div className="wrap header-row">
          <Link href="/" aria-label="Globriefly home"><Logo /></Link>
          <div className="header-actions">
            <a className="btn" href="/#brief">Get the brief</a>
          </div>
        </div>
        <nav className="wrap nav" aria-label="Categories">
          <Link href="/" className={!active ? 'active' : ''}>Top stories</Link>
          {categories.map((c) => (
            <Link key={c.slug} href={`/${c.slug}/`} className={active === c.slug ? 'active' : ''}>{c.label}</Link>
          ))}
        </nav>
      </header>
      {breaking && (
        <div className="breaking">
          <div className="wrap">
            <span className="pill-red">BREAKING</span>
            <Link href={`/news/${breaking.slug}/`}>{breaking.headline}</Link>
          </div>
        </div>
      )}
    </>
  );
}

export function Footer() {
  return (
    <footer className="footer pattern-dark">
      <div className="wrap footer-top">
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Link href="/" aria-label="Globriefly home" className="footer-logo"><Logo dark size={26} /></Link>
          <span style={{ fontSize: 17, fontWeight: 600, color: '#fff' }}>{site.tagline}</span>
          <p style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 380 }}>Clear, fast coverage of the stories shaping the world, with links to the original reporting in every article.</p>
          <div className="footer-social">
            <a href={site.facebookUrl} target="_blank" rel="noopener me" aria-label="Globriefly on Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.4 0-4.1 1.5-4.1 4.2v2.3H7.5V14h2.7v8h3.3z" /></svg>
              Follow us on Facebook
            </a>
            <Link href="/rss/" aria-label="RSS feed">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="19" r="2.2" fill="currentColor" /><path d="M3 10.5a10.5 10.5 0 0 1 10.5 10.5M3 3.5A17.5 17.5 0 0 1 20.5 21" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
              RSS
            </Link>
          </div>
        </div>
        <nav className="footer-cats" aria-label="Footer categories">
          {categories.map((c) => <Link key={c.slug} href={`/${c.slug}/`}>{c.label}</Link>)}
        </nav>
        <nav className="footer-links" aria-label="Company">
          <Link href="/about/">About</Link>
          <Link href="/editorial-standards/">Editorial standards</Link>
          <Link href="/corrections/">Corrections</Link>
          <Link href="/contact/">Contact</Link>
          <Link href="/advertise/">Advertise</Link>
        </nav>
        <nav className="footer-links" aria-label="More">
          <Link href="/archive/">All stories</Link>
          <Link href="/site-map/">Site map</Link>
          <Link href="/privacy/">Privacy policy</Link>
          <Link href="/cookies/">Cookie policy</Link>
          <Link href="/terms/">Terms of use</Link>
          <Link href="/rss/">RSS feed</Link>
        </nav>
      </div>
      <div className="wrap footer-bottom">© {new Date().getFullYear()} Globriefly. All rights reserved.</div>
    </footer>
  );
}

export function Thumb({ post, ratio = 'r1610', className = '', style }) {
  if (post?.image?.src) {
    return <img src={post.image.src} alt={post.image.alt || post.headline} className={`thumb ${ratio} ${className}`} style={{ backgroundColor: post.cat?.color, ...style }} loading="lazy" />;
  }
  return <div className={`thumb ${ratio} ${className}`} style={{ backgroundColor: post?.cat?.color, ...style }} aria-hidden="true" />;
}

export function Kicker({ post }) {
  return <span className="kicker" style={{ color: post.cat.color }}>{post.cat.label}</span>;
}

export function Card({ post, ratio = 'r1610', small = false, showTime = true }) {
  return (
    <Link href={`/news/${post.slug}/`} className={`card${small ? ' sm' : ''}`}>
      <Thumb post={post} ratio={ratio} />
      <Kicker post={post} />
      <h3 className="hl">{post.headline}</h3>
      {showTime && <span className="meta"><TimeAgo iso={post.publishedAt} /></span>}
    </Link>
  );
}

export function SecHead({ title, href, linkText = 'See all', color }) {
  return (
    <div className="sec-head" style={color ? { borderBottomColor: color } : undefined}>
      <h2>{title}</h2>
      {href && <Link href={href}>{linkText}</Link>}
    </div>
  );
}

export function Newsletter() {
  return (
    <section id="brief" className="wrap">
      <div className="newsletter pattern-color">
        <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span className="kicker" style={{ color: '#FFD6DB' }}>The morning brief</span>
          <h2>The world in five minutes, every morning.</h2>
          <p style={{ fontSize: 17, color: '#FFE5E8', lineHeight: 1.5 }}>The day’s biggest stories in one short email. Free, and you can unsubscribe any time.</p>
        </div>
        <NewsletterForm />
      </div>
    </section>
  );
}

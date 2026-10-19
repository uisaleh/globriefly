import Link from 'next/link';
import { site, categories } from '@/site.config.mjs';
import TimeAgo, { Today } from './TimeAgo';

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
          <Logo dark size={26} />
          <span style={{ fontSize: 17, fontWeight: 600, color: '#fff' }}>{site.tagline}</span>
          <p style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 380 }}>Clear, fast coverage of the stories shaping the world, with links to the original reporting in every article.</p>
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
          <a href={site.facebookUrl} rel="noopener">Facebook</a>
          <a href="/rss.xml">RSS feed</a>
        </nav>
      </div>
      <div className="wrap footer-bottom">© {new Date().getFullYear()} Globriefly. All rights reserved.</div>
    </footer>
  );
}

export function Thumb({ post, ratio = 'r1610', className = '', style }) {
  if (post?.image?.src) {
    return <img src={post.image.src} alt={post.image.alt || post.headline} className={`thumb ${ratio} ${className}`} style={style} loading="lazy" />;
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
        <form action={site.newsletterAction || undefined} method="post" target="_blank">
          <label htmlFor="nl-email" className="sr-only">Email address</label>
          <input id="nl-email" name="email" type="email" required placeholder="you@example.com" />
          <button type="submit">Subscribe free</button>
        </form>
      </div>
    </section>
  );
}

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { categoryBySlug } from '../site.config.mjs';
import { fetchWithTimeout } from './util.mjs';
import { patternArea } from '../lib/pattern.mjs';
import { env } from './config.mjs';

const SITE_HOST = new URL(env.SITE_URL).host.replace(/^www\./, '');

const require = createRequire(import.meta.url);
const fontFile = (w) => fs.readFileSync(require.resolve(`@fontsource/archivo/files/archivo-latin-${w}-normal.woff`));
const fonts = [400, 700, 800, 900].map((w) => ({ name: 'Archivo', data: fontFile(w), weight: w, style: 'normal' }));

const W = 1080, H = 1350, PHOTO_H = 750;
const INK = '#0E1116', RED = '#E5142B';
const PANEL_H = H - PHOTO_H - 14;
// Soft brand pattern behind the text panel (white globe marks at low opacity on the category colour).
const PANEL_PATTERN = `data:image/svg+xml;base64,${Buffer.from(patternArea(W, PANEL_H, '#FFFFFF', 0.07, 1.4)).toString('base64')}`;

const mark = (stroke, bar) => `data:image/svg+xml;base64,${Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="14" cy="16" r="11" fill="none" stroke="${stroke}" stroke-width="3"/><ellipse cx="14" cy="16" rx="4.5" ry="11" fill="none" stroke="${stroke}" stroke-width="2"/><rect x="9" y="13.5" width="23" height="5" rx="1" fill="${bar}"/></svg>`
).toString('base64')}`;

const h = (type, style, children) => ({ type, props: { style, children } });
const img = (src, style) => ({ type: 'img', props: { src, style } });

async function toDataUri(url) {
  if (!url) return null;
  // Photos stored on the site itself (e.g. supplied photos in public/images/)
  if (url.startsWith('/')) {
    try {
      const file = path.join(process.cwd(), 'public', url);
      const ext = path.extname(file).toLowerCase();
      if (!/\.(jpe?g|png)$/.test(ext)) return null;
      return `data:image/${ext === '.png' ? 'png' : 'jpeg'};base64,${fs.readFileSync(file).toString('base64')}`;
    } catch { return null; }
  }
  try {
    const res = await fetchWithTimeout(url, {}, 20000);
    if (!res.ok) return null;
    const type = res.headers.get('content-type') || 'image/jpeg';
    if (!/jpe?g|png/.test(type)) return null; // satori/resvg reliably handle JPEG and PNG
    return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
  } catch {
    return null;
  }
}

function clip(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;
}

// e.g. "12 October 2026" (UTC, so every card matches the article's published date)
function cardDate(iso) {
  return new Date(iso || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// Renders the Facebook photocard (1080×1350 PNG) for a post.
// Layout: photo on top with a category-coloured frame line inside it; text panel in the category colour below.
// The card font is Latin-only, so Cyrillic/Greek credits are transliterated (otherwise they render as boxes).
const TR = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',і:'i',ї:'yi',є:'ye',ґ:'g',
  α:'a',β:'v',γ:'g',δ:'d',ε:'e',ζ:'z',η:'i',θ:'th',ι:'i',κ:'k',λ:'l',μ:'m',ν:'n',ξ:'x',ο:'o',π:'p',ρ:'r',σ:'s',ς:'s',τ:'t',υ:'y',φ:'f',χ:'ch',ψ:'ps',ω:'o' };
function latinize(str = '') {
  const out = [...str].map((ch) => {
    const lo = ch.toLowerCase();
    if (!(lo in TR)) return ch;
    const t = TR[lo];
    return ch !== lo && t ? t[0].toUpperCase() + t.slice(1) : t;
  }).join('');
  return out.replace(/[^\x00-\u024F\u2010-\u2027]/g, '').replace(/\s+/g, ' ').trim() || 'Wikimedia Commons';
}

export async function renderCard(post) {
  const cat = categoryBySlug[post.category] || categoryBySlug.world;
  const photo = await toDataUri(post.image?.src);
  const headline = clip(post.headline, 140);
  const size = headline.length > 110 ? 50 : headline.length > 85 ? 56 : headline.length > 52 ? 62 : 78;
  const summary = clip(post.socialSummary || post.standfirst, 120);

  const tree = h('div', { width: W, height: H, display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: cat.color, fontFamily: 'Archivo', color: '#fff' }, [
    img(PANEL_PATTERN, { position: 'absolute', top: PHOTO_H, left: 0, width: W, height: PANEL_H }),
    // Photo area
    h('div', { width: W, height: PHOTO_H, display: 'flex', position: 'relative', backgroundColor: '#2A2F38' }, [
      photo
        ? img(photo, { position: 'absolute', top: 0, left: 0, width: W, height: PHOTO_H, objectFit: 'cover' })
        : h('div', { position: 'absolute', top: 0, left: 0, width: W, height: PHOTO_H, display: 'flex', backgroundImage: `linear-gradient(135deg, ${cat.color} 0%, ${INK} 100%)` }, []),
      // Category-coloured frame line inside the photo
      h('div', { position: 'absolute', top: 28, left: 28, width: W - 56, height: PHOTO_H - 28, display: 'flex', borderTop: `8px solid ${cat.color}`, borderLeft: `8px solid ${cat.color}`, borderRight: `8px solid ${cat.color}` }, []),
      // Logo blocks
      h('div', { position: 'absolute', top: 64, left: 64, display: 'flex', gap: 6 }, [
        h('div', { width: 92, height: 92, backgroundColor: INK, display: 'flex', alignItems: 'center', justifyContent: 'center' }, [img(mark('#FFFFFF', RED), { width: 62, height: 62 })]),
        h('div', { height: 92, padding: '0 26px', backgroundColor: INK, display: 'flex', alignItems: 'center', fontSize: 48, fontWeight: 900, letterSpacing: '-0.045em' }, 'globriefly'),
      ]),
      ...(post.breaking ? [h('div', { position: 'absolute', top: 64, right: 64, height: 92, padding: '0 28px', backgroundColor: RED, display: 'flex', alignItems: 'center', fontSize: 32, fontWeight: 900, letterSpacing: '0.06em' }, 'BREAKING')] : []),
    ]),

    // Text panel in the category colour
    h('div', { flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 64px 0', gap: 22 }, [
      h('div', { display: 'flex', alignItems: 'center', gap: 22 }, [
        h('div', { backgroundColor: '#FFFFFF', color: cat.color, fontSize: 28, fontWeight: 900, letterSpacing: '0.08em', padding: '9px 20px', display: 'flex' }, cat.label.toUpperCase()),
        h('div', { fontSize: 27, fontWeight: 700, color: 'rgba(255,255,255,0.88)', letterSpacing: '0.02em', display: 'flex' }, cardDate(post.publishedAt)),
      ]),
      h('div', { fontSize: size, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.015em', display: 'flex', flexShrink: 0 }, headline),
      h('div', { fontSize: 31, lineHeight: 1.36, color: 'rgba(255,255,255,0.88)', display: 'flex', flexShrink: 0 }, summary),
      h('div', { marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 0 34px', borderTop: '2px solid rgba(255,255,255,0.28)' }, [
        h('div', { fontSize: 30, fontWeight: 800, display: 'flex' }, SITE_HOST),
        h('div', { fontSize: 23, color: 'rgba(255,255,255,0.78)', display: 'flex' }, post.image?.credit ? clip(`Photo: ${latinize(post.image.credit)}`, 46) : 'Full story: link in comments'),
      ]),
    ]),
    // Brand bar
    h('div', { display: 'flex', height: 14 }, [h('div', { flex: 7, backgroundColor: INK, display: 'flex' }, []), h('div', { flex: 3, backgroundColor: RED, display: 'flex' }, [])]),
  ]);

  const svg = await satori(tree, { width: W, height: H, fonts });
  return new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
}

export async function saveCard(post, dir) {
  const png = await renderCard(post);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${post.slug}.png`);
  fs.writeFileSync(file, png);
  return file;
}

// Link-preview image (Open Graph) — 1200×630, the shape Facebook, X, WhatsApp and LinkedIn show for links.
// Same look as the photocard: the story photo, category-coloured frame, globriefly logo, category + date.
// Hosted on our own domain so Facebook can always fetch it (hotlinked Wikimedia images often fail there).
const OW = 1200, OH = 630;
export async function renderOg(post) {
  const cat = categoryBySlug[post.category] || categoryBySlug.world;
  const photo = await toDataUri(post.image?.src);
  const pattern = `data:image/svg+xml;base64,${Buffer.from(patternArea(OW, OH, '#FFFFFF', 0.08, 1.3)).toString('base64')}`;
  const headline = clip(post.headline, 95);
  const tree = h('div', { width: OW, height: OH, display: 'flex', position: 'relative', backgroundColor: cat.color, fontFamily: 'Archivo', color: '#fff' }, [
    photo
      ? img(photo, { position: 'absolute', top: 0, left: 0, width: OW, height: OH - 10, objectFit: 'cover' })
      : img(pattern, { position: 'absolute', top: 0, left: 0, width: OW, height: OH }),
    // No photo: the headline carries the image instead
    ...(photo ? [] : [h('div', { position: 'absolute', left: 56, right: 56, bottom: 120, display: 'flex', fontSize: headline.length > 70 ? 54 : 62, fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.02em' }, headline)]),
    // Category-coloured frame
    h('div', { position: 'absolute', top: 22, left: 22, width: OW - 44, height: OH - 54, display: 'flex', border: `7px solid ${cat.color}` }, []),
    // Logo
    h('div', { position: 'absolute', top: 48, left: 48, display: 'flex', gap: 5 }, [
      h('div', { width: 72, height: 72, backgroundColor: INK, display: 'flex', alignItems: 'center', justifyContent: 'center' }, [img(mark('#FFFFFF', RED), { width: 48, height: 48 })]),
      h('div', { height: 72, padding: '0 20px', backgroundColor: INK, display: 'flex', alignItems: 'center', fontSize: 38, fontWeight: 900, letterSpacing: '-0.045em' }, 'globriefly'),
    ]),
    ...(post.breaking ? [h('div', { position: 'absolute', top: 48, right: 48, height: 72, padding: '0 22px', backgroundColor: RED, display: 'flex', alignItems: 'center', fontSize: 26, fontWeight: 900, letterSpacing: '0.06em' }, 'BREAKING')] : []),
    // Category + date
    h('div', { position: 'absolute', left: 48, bottom: 54, display: 'flex', alignItems: 'stretch' }, [
      h('div', { backgroundColor: photo ? cat.color : '#FFFFFF', color: photo ? '#FFFFFF' : cat.color, fontSize: 24, fontWeight: 900, letterSpacing: '0.08em', padding: '10px 18px', display: 'flex' }, cat.label.toUpperCase()),
      h('div', { backgroundColor: INK, fontSize: 22, fontWeight: 700, padding: '10px 18px', display: 'flex', alignItems: 'center' }, cardDate(post.publishedAt)),
    ]),
    // Brand bar
    h('div', { position: 'absolute', left: 0, bottom: 0, width: OW, height: 10, display: 'flex' }, [h('div', { flex: 7, backgroundColor: INK, display: 'flex' }, []), h('div', { flex: 3, backgroundColor: RED, display: 'flex' }, [])]),
  ]);
  const svg = await satori(tree, { width: OW, height: OH, fonts });
  return new Resvg(svg, { fitTo: { mode: 'width', value: OW } }).render().asPng();
}

// Saves public/og/<slug>.jpg (JPEG keeps it small; falls back to PNG if sharp is unavailable)
// and returns the site path to store on the post as `ogImage`.
export async function saveOg(post, root = process.cwd()) {
  const png = await renderOg(post);
  const dir = path.join(root, 'public', 'og');
  fs.mkdirSync(dir, { recursive: true });
  try {
    const sharp = (await import('sharp')).default;
    const jpg = await sharp(png).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
    fs.writeFileSync(path.join(dir, `${post.slug}.jpg`), jpg);
    return `/og/${post.slug}.jpg`;
  } catch {
    fs.writeFileSync(path.join(dir, `${post.slug}.png`), png);
    return `/og/${post.slug}.png`;
  }
}

// ===== Reel frame (1080×1920, transparent video window) =====
// Layout keeps key text out of Facebook's Reels overlay zones (top bar, bottom caption area).
export const REEL = { W: 1080, H: 1920, X: 40, Y: 600, VW: 1000, VH: 760 };
export async function renderReelFrame(post) {
  const { W: RW, H: RH, X, Y, VW, VH } = REEL;
  const cat = categoryBySlug[post.category] || categoryBySlug.world;
  const headline = clip(post.headline || '', 100);
  const size = headline.length > 80 ? 54 : headline.length > 50 ? 60 : 70;
  const pat = (w, hh) => `data:image/svg+xml;base64,${Buffer.from(patternArea(w, hh, '#FFFFFF', 0.07, 1.4)).toString('base64')}`;
  const panel = (top, left, w, hh) => h('div', { position: 'absolute', top, left, width: w, height: hh, display: 'flex', backgroundColor: cat.color, overflow: 'hidden' }, [
    img(pat(RW, RH), { position: 'absolute', top: -top, left: -left, width: RW, height: RH }),
  ]);
  const tree = h('div', { width: RW, height: RH, display: 'flex', position: 'relative', fontFamily: 'Archivo', color: '#fff' }, [
    // Coloured panels around the transparent video window
    panel(0, 0, RW, Y),
    panel(Y + VH, 0, RW, RH - Y - VH),
    panel(Y, 0, X, VH),
    panel(Y, X + VW, RW - X - VW, VH),
    // Frame line around the video
    h('div', { position: 'absolute', top: Y - 8, left: X - 8, width: VW + 16, height: VH + 16, display: 'flex', border: '8px solid #FFFFFF', borderRadius: 4 }, []),
    // Logo
    h('div', { position: 'absolute', top: 150, left: 56, display: 'flex', gap: 6 }, [
      h('div', { width: 84, height: 84, backgroundColor: INK, display: 'flex', alignItems: 'center', justifyContent: 'center' }, [img(mark('#FFFFFF', RED), { width: 56, height: 56 })]),
      h('div', { height: 84, padding: '0 24px', backgroundColor: INK, display: 'flex', alignItems: 'center', fontSize: 44, fontWeight: 900, letterSpacing: '-0.045em' }, 'globriefly'),
    ]),
    ...(post.breaking ? [h('div', { position: 'absolute', top: 150, right: 56, height: 84, padding: '0 26px', backgroundColor: RED, display: 'flex', alignItems: 'center', fontSize: 30, fontWeight: 900, letterSpacing: '0.06em' }, 'BREAKING')] : []),
    // Category + date
    h('div', { position: 'absolute', top: 268, left: 56, display: 'flex', alignItems: 'center', gap: 20 }, [
      h('div', { backgroundColor: '#FFFFFF', color: cat.color, fontSize: 26, fontWeight: 900, letterSpacing: '0.08em', padding: '8px 18px', display: 'flex' }, cat.label.toUpperCase()),
      h('div', { fontSize: 26, fontWeight: 700, color: 'rgba(255,255,255,0.9)', display: 'flex' }, cardDate(post.publishedAt)),
    ]),
    // Headline
    h('div', { position: 'absolute', top: 336, left: 56, right: 56, height: Y - 336 - 28, display: 'flex', alignItems: 'flex-start' }, [
      h('div', { fontSize: size, fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.015em', display: 'flex' }, headline),
    ]),
    // Footer
    h('div', { position: 'absolute', top: Y + VH + 34, left: 56, right: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, [
      h('div', { fontSize: 32, fontWeight: 800, display: 'flex' }, SITE_HOST),
      h('div', { fontSize: 24, color: 'rgba(255,255,255,0.85)', display: 'flex' }, post.videoCredit ? clip(`Video: ${latinize(post.videoCredit)}`, 44) : 'Full story on our website'),
    ]),
    // Brand bar
    h('div', { position: 'absolute', left: 0, bottom: 0, width: RW, height: 14, display: 'flex' }, [h('div', { flex: 7, backgroundColor: INK, display: 'flex' }, []), h('div', { flex: 3, backgroundColor: RED, display: 'flex' }, [])]),
  ]);
  const svg = await satori(tree, { width: RW, height: RH, fonts });
  return new Resvg(svg, { fitTo: { mode: 'width', value: RW }, background: 'rgba(0,0,0,0)' }).render().asPng();
}

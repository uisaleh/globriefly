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
  const headline = clip(post.headline, 110);
  const size = headline.length > 85 ? 56 : headline.length > 52 ? 62 : 78;
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

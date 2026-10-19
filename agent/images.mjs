import { env } from './config.mjs';
import { fetchWithTimeout, log } from './util.mjs';

// Every image is licensed for reuse and credited. Order:
// 1) Wikimedia Commons — real photos of the actual people, places and events (CC / public domain)
// 2) Pexels, 3) Unsplash — free-licence photos for general subjects.
// Images are hotlinked from the provider's CDN, so the repository stays small.

const OK_LICENSE = /^(cc0|cc[- ]by(-sa)?([- ][0-9.]+)?|public domain|pd|attribution)/i;
const BAD_TITLE = /(logo|flag|map|coat of arms|seal|icon|diagram|chart|signature|locator|svg)/i;
const strip = (h = '') => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

async function wikimedia(query) {
  const u = new URL('https://commons.wikimedia.org/w/api.php');
  Object.entries({
    action: 'query', format: 'json', generator: 'search', gsrnamespace: '6', gsrlimit: '12',
    gsrsearch: `${query} filetype:bitmap`, prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600',
  }).forEach(([k, v]) => u.searchParams.set(k, v));
  const res = await fetchWithTimeout(u, {}, 15000);
  if (!res.ok) return null;
  const pages = Object.values((await res.json())?.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii || !/jpe?g|png|webp/.test(ii.mime) || ii.width < 900 || ii.width < ii.height) continue;
    if (BAD_TITLE.test(p.title)) continue;
    const md = ii.extmetadata || {};
    const license = strip(md.LicenseShortName?.value);
    if (!OK_LICENSE.test(license)) continue;
    const artist = strip(md.Artist?.value) || 'Wikimedia Commons';
    return {
      src: ii.thumburl || ii.url,
      alt: strip(md.ImageDescription?.value).slice(0, 160) || query,
      credit: `${artist.slice(0, 80)} / Wikimedia Commons`,
      creditUrl: ii.descriptionurl,
      license,
      provider: 'wikimedia',
    };
  }
  return null;
}

async function pexels(query) {
  if (!env.PEXELS_API_KEY) return null;
  const res = await fetchWithTimeout(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`, { headers: { Authorization: env.PEXELS_API_KEY } });
  if (!res.ok) return null;
  const ph = (await res.json())?.photos?.[0];
  if (!ph) return null;
  return { src: ph.src.large2x || ph.src.large, alt: ph.alt || query, credit: `${ph.photographer} / Pexels`, creditUrl: ph.url, license: 'Pexels License', provider: 'pexels' };
}

async function unsplash(query) {
  if (!env.UNSPLASH_ACCESS_KEY) return null;
  const headers = { Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}` };
  const res = await fetchWithTimeout(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`, { headers });
  if (!res.ok) return null;
  const ph = (await res.json())?.results?.[0];
  if (!ph) return null;
  // Unsplash API guidelines: register a download when a photo is used.
  fetchWithTimeout(ph.links.download_location, { headers }).catch(() => {});
  return {
    src: ph.urls.regular,
    alt: ph.alt_description || query,
    credit: `${ph.user.name} / Unsplash`,
    creditUrl: `${ph.user.links.html}?utm_source=globriefly&utm_medium=referral`,
    license: 'Unsplash License',
    provider: 'unsplash',
  };
}

// Alt text: use the photographer's own English description when it is meaningful,
// otherwise the writer's description of the subject. Never empty.
export function makeAlt(providerAlt, writerAlt, query) {
  const clean = (s = '') => strip(s).replace(/^(file:|image of |photo of |picture of )/i, '').replace(/\.(jpe?g|png|webp)$/i, '').trim();
  const p = clean(providerAlt);
  const latin = p && (p.match(/[A-Za-z]/g) || []).length / p.length > 0.6;
  const useful = latin && p.split(/\s+/).length >= 4 && !/^(img|dsc|photo)[_ -]?\d/i.test(p);
  let alt = useful ? p : clean(writerAlt) || `Photo of ${query}`;
  if (alt.length > 125) alt = alt.slice(0, 124).replace(/\s+\S*$/, '') + '…';
  return alt.charAt(0).toUpperCase() + alt.slice(1);
}

export async function findImage(query, fallbackQuery, writerAlt = '') {
  const img = await pickImage(query, fallbackQuery);
  if (img) img.alt = makeAlt(img.alt, writerAlt, query);
  return img;
}

async function pickImage(query, fallbackQuery) {
  const tries = [
    () => wikimedia(query),
    () => pexels(query),
    () => unsplash(query),
    () => (fallbackQuery ? pexels(fallbackQuery) : null),
    () => (fallbackQuery ? unsplash(fallbackQuery) : null),
  ];
  for (const t of tries) {
    try {
      const img = await t();
      if (img) return img;
    } catch (e) {
      log('image source error:', e.message);
    }
  }
  return null;
}

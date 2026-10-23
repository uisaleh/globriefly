import { env } from './config.mjs';
import { fetchWithTimeout, log } from './util.mjs';

// Every image is licensed for reuse and credited. Order:
// 1) Wikimedia Commons — real photos of the actual people, places and events (CC / public domain)
// 2) Openverse — openly licensed photos (Flickr, museums, etc.), no API key needed; commercial-use licences only
// 3) Pexels, 4) Unsplash — free-licence photos for general subjects (only when keys are set).
// Images are hotlinked from the provider's CDN, so the repository stays small.

const OK_LICENSE = /^(cc0|cc[- ]by(-sa)?([- ][0-9.]+)?|public domain|pd|attribution)/i;
const BAD_TITLE = /(logo|flag|map|coat of arms|seal|icon|diagram|chart|signature|locator|svg)/i;
const strip = (h = '') => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

// Relevance: the photo's file name / description must mention the query words.
// mode 'all' = every word (names: "Real Madrid" must not match "Teatro Real de Madrid" only by luck — see order below),
// 'most' = at least 60 %, 'any' = at least one.
const STOP = new Set(['the', 'and', 'for', 'with', 'from', 'into', 'over', 'after', 'new', 'of', 'in', 'on', 'at', 'to', 'a', 'an', 'its', 'his', 'her']);
const words = (s = '') => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));
// Words a photo description may lack without being off-topic.
const SOFT = new Set(['website', 'site', 'app', 'logo', 'building', 'headquarters', 'hq', 'office', 'offices', 'city', 'skyline', 'street', 'photo', 'portrait', 'event', 'press', 'conference', 'meeting', 'speech', 'speaking', 'official', 'view', 'scene', 'close', 'up', 'exterior', 'interior', 'sign', 'flag']);
const norm = (s = '') => ' ' + words(s).join(' ') + ' ';
function relevant(query, text, mode = 'most', ctx = []) {
  const q = [...new Set(words(query))];
  if (!q.length) return true;
  const tw = words(text);
  const t = new Set(tw);
  const has = (w) => t.has(w) || t.has(w.replace(/s$/, '')) || t.has(w + 's');
  const nt = ' ' + tw.join(' ') + ' ';
  if (mode === 'name') {
    if (!nt.includes(' ' + q.join(' ') + ' ')) return false; // the whole name, as a phrase
    // One-word names are ambiguous (Apple the company vs the fruit): also need a word from the story.
    return q.length > 1 || !ctx.length || ctx.some((w) => !q.includes(w) && has(w));
  }
  if (mode === 'any') return q.some(has);
  if (mode === 'all') return q.every(has);
  // 'most': important words must be there (one may be missing in a 3+ word search), and at least two of
  // them must sit side by side — so "Apple Music" won't match "Mrs Green Apple … Music Awards".
  const key = q.filter((w) => !SOFT.has(w));
  if (!key.length) return q.some(has);
  const missing = key.filter((w) => !has(w)).length;
  if (missing > (key.length >= 3 ? 1 : 0)) return false;
  if (key.length < 2) return true;
  for (let i = 0; i < key.length - 1; i++) if (nt.includes(` ${key[i]} ${key[i + 1]} `)) return true;
  return false;
}

async function wikimedia(query, mode = 'most', ctx = []) {
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
    const about = `${p.title} ${strip(md.ImageDescription?.value)} ${strip(md.ObjectName?.value)} ${strip(md.Categories?.value)}`;
    if (!relevant(query, about, mode, ctx)) continue;
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

// Openverse: only licences that allow commercial reuse (CC0, PDM, CC BY, CC BY-SA). No key required.
async function openverse(query, mode = 'most', ctx = []) {
  const u = new URL('https://api.openverse.org/v1/images/');
  Object.entries({ q: query, license: 'cc0,pdm,by,by-sa', aspect_ratio: 'wide', size: 'large', mature: 'false', page_size: '12' })
    .forEach(([k, v]) => u.searchParams.set(k, v));
  const res = await fetchWithTimeout(u, { headers: { Accept: 'application/json' } }, 15000);
  if (!res.ok) return null;
  for (const r of (await res.json())?.results || []) {
    if (!r.url || (r.width && r.width < 900) || BAD_TITLE.test(r.title || '')) continue;
    if (!relevant(query, `${r.title || ''} ${(r.tags || []).map((t) => t.name).join(' ')}`, mode, ctx)) continue;
    if (!/\.(jpe?g|png|webp)(\?|$)/i.test(r.url) && r.filetype && !/jpe?g|png|webp/i.test(r.filetype)) continue;
    const lic = r.license === 'pdm' ? 'Public domain' : r.license === 'cc0' ? 'CC0' : `CC ${r.license.toUpperCase()} ${r.license_version || ''}`.trim();
    const who = (r.creator || r.source || 'Openverse').slice(0, 80);
    return {
      src: r.url,
      alt: r.title || query,
      credit: `${who} / ${r.source === 'wikimedia' ? 'Wikimedia Commons' : (r.source || 'Openverse').replace(/^\w/, (c) => c.toUpperCase())}`,
      creditUrl: r.foreign_landing_url || r.detail_url,
      license: lic,
      provider: 'openverse',
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

// Names a photo could show, from the writer's list, else from capitalised names in the headline / tags.
export function namesFrom({ imageNames = [], headline = '', tags = [] } = {}) {
  const out = [...(Array.isArray(imageNames) ? imageNames : [])];
  // Proper-noun runs in the headline (headlines are sentence case, so capitals mid-sentence are names).
  const words = headline.split(/\s+/);
  let run = [];
  const GENERIC = /^(Record|Major|Severe|Global|Independent|Prime|Big|Top|First|Last|Breaking|Exclusive)$/;
  const flush = () => { while (run.length > 1 && GENERIC.test(run[0])) run.shift(); if (run.length) out.push(run.join(' ')); run = []; };
  const inTags = (w) => tags.some((t) => /^\p{Lu}/u.test(t) && t.toLowerCase().split(/\s+/).includes(w.toLowerCase()));
  words.forEach((w, i) => {
    const clean = w.replace(/[^\p{L}\p{N}&.'’-]/gu, '');
    let isCap = /^\p{Lu}/u.test(clean);
    // First word of a sentence-case headline is capitalised anyway: only keep it if it is clearly a name
    // (an acronym, part of a multi-word name, or one of the story's tags).
    if (isCap && i === 0) {
      const nextCap = /^\p{Lu}/u.test((words[1] || '').replace(/[^\p{L}]/gu, ''));
      isCap = /^\p{Lu}{2,}/u.test(clean) || nextCap || inTags(clean);
    }
    if (isCap) run.push(clean); else flush();
  });
  flush();
  // Tags that look like names (capitalised) and also appear in the headline come next.
  tags.filter((t) => /^\p{Lu}/u.test(t) && headline.toLowerCase().includes(t.toLowerCase())).forEach((t) => out.push(t));
  // Nationality words on their own ("American", "Portuguese") are not something a photo can show.
  const DEMONYM = /^(American|European|African|Asian|British|English|French|German|Chinese|Russian|Portuguese|Spanish|Italian|Indian|Pakistani|Brazilian|Australian|Israeli|Palestinian|Iranian|Ukrainian|Japanese|Korean|Turkish|Canadian|Mexican|Nigerian|Egyptian|Saudi|Arab|Western|Eastern|Northern|Southern|Independent|Prime|Major|Record|Severe|Global|National|International)$/;
  const seen = new Set();
  return out.map((n) => String(n).trim().replace(/['’]s$/, '')).filter((n) => n.length > 2 && !DEMONYM.test(n) && !seen.has(n.toLowerCase()) && seen.add(n.toLowerCase())).slice(0, 4);
}

// Photo search, in order of how closely the photo matches the story:
//   1. the story's own photo idea (writer's imageQuery)
//   2. the people / companies / places named in the headline
//   3. the general subject of the story
// Free licensed sources only (Wikimedia Commons, Openverse; Pexels/Unsplash for generic subjects when keys exist).
export async function findImageFor(info, writerAlt = '') {
  const tries = [];
  const q = (info.imageQuery || '').trim();
  if (q) tries.push(['idea', q, () => wikimedia(q, 'most')], ['idea', q, () => openverse(q, 'most')]);
  // Story words that confirm a one-word name is the right "Apple", "Meta", "Amazon"…
  const ctx = [...new Set(words(`${info.headline || ''} ${(info.tags || []).join(' ')} ${info.imageSubject || ''}`))].filter((w) => w.length > 3);
  // Longer, more specific names first ("Apple Music" before "Apple").
  const names = namesFrom(info).sort((a, b) => b.split(/\s+/).length - a.split(/\s+/).length);
  for (const name of names) {
    tries.push(['name', name, () => wikimedia(name, 'name', ctx)], ['name', name, () => openverse(name, 'name', ctx)]);
  }
  const subject = (info.imageSubject || info.fallbackSubject || '').trim();
  if (subject) {
    tries.push(['subject', subject, () => wikimedia(subject, 'most')], ['subject', subject, () => openverse(subject, 'most')]);
    tries.push(['subject', subject, () => pexels(subject)], ['subject', subject, () => unsplash(subject)]);
  }
  if (q) tries.push(['idea', q, () => pexels(q)], ['idea', q, () => unsplash(q)]);
  for (const [step, query, t] of tries) {
    try {
      const img = await t();
      if (img) {
        // The writer's alt text describes their photo idea; for a name/subject match describe what was matched.
        img.alt = makeAlt(img.alt, step === 'idea' ? writerAlt : query, query);
        img.query = query;
        img.matchedBy = step; // idea | name | subject — useful when reviewing photos
        return img;
      }
    } catch (e) {
      log('image source error:', e.message);
    }
  }
  return null;
}

// Kept for older callers: query + fallback query.
export async function findImage(query, fallbackQuery, writerAlt = '') {
  return findImageFor({ imageQuery: query, imageSubject: fallbackQuery }, writerAlt);
}

async function pickImage(query, fallbackQuery) {
  const tries = [
    () => wikimedia(query),
    () => openverse(query),
    () => (fallbackQuery ? wikimedia(fallbackQuery) : null),
    () => (fallbackQuery ? openverse(fallbackQuery) : null),
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

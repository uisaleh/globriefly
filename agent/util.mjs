import fs from 'node:fs';
import path from 'node:path';

export const ROOT = process.cwd();
export const POSTS_DIR = path.join(ROOT, 'content', 'posts');
export const STATE_FILE = path.join(ROOT, 'content', 'state', 'seen.json');
export const CARDS_DIR = path.join(ROOT, ".cache", "cards");
export const IMAGES_DIR = path.join(ROOT, ".cache", "images");

export const UA = 'GlobrieflyBot/1.0 (+https://globriefly.vercel.app/about/; news aggregation)';

export const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

export function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

export function writeJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

export function slugify(s) {
  return s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72).replace(/-+$/, '');
}

const STOP = new Set('a an the of in on at to for and or but is are was were be been with by from as after over into amid says say said new its it their his her this that will would could after more than up out about against not no'.split(' '));

export function tokens(s) {
  return new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));
}

export function similarity(a, b) {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / Math.min(A.size, B.size);
}

export function fingerprint(s) {
  return [...tokens(s)].sort().slice(0, 8).join('-');
}

// The timeout covers the whole request, including reading the body, so a slow server can never stall the agent.
export async function fetchWithTimeout(url, opts = {}, ms = 15000) {
  const signal = AbortSignal.timeout(ms);
  return fetch(url, { ...opts, signal, headers: { 'User-Agent': UA, ...(opts.headers || {}) } });
}

// Run a promise with a hard deadline (resolves to `fallback` instead of hanging).
export function withDeadline(promise, ms, fallback = null) {
  let t;
  const timer = new Promise((resolve) => { t = setTimeout(() => resolve(fallback), ms); t.unref?.(); });
  return Promise.race([promise.catch(() => fallback), timer]).finally(() => clearTimeout(t));
}

export function loadPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.json')).map((f) => ({ file: path.join(POSTS_DIR, f), ...readJSON(path.join(POSTS_DIR, f), {}) }));
}

// Detect copied wording: count 8-word sequences shared between our text and the sources.
export function sharedPhrases(ours, sources, n = 8) {
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const grams = new Set();
  for (const src of sources) {
    const w = norm(src);
    for (let i = 0; i + n <= w.length; i++) grams.add(w.slice(i, i + n).join(' '));
  }
  const w = norm(ours);
  let hits = 0;
  for (let i = 0; i + n <= w.length; i++) if (grams.has(w.slice(i, i + n).join(' '))) hits++;
  return hits;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

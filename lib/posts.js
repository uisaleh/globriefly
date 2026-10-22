import fs from 'node:fs';
import path from 'node:path';
import { categoryBySlug } from '@/site.config.mjs';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
const SAMPLES_DIR = path.join(process.cwd(), 'content', 'samples');

function readDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

let cache;
export function getAllPosts() {
  if (cache) return cache;
  let posts = readDir(POSTS_DIR).filter((p) => p.status !== 'draft');
  // Until the agent publishes its first real stories, show the sample stories so the site is never empty.
  if (posts.length === 0) posts = readDir(SAMPLES_DIR);
  posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  cache = posts.map((p) => ({ ...p, cat: categoryBySlug[p.category] || categoryBySlug.world }));
  return cache;
}

export function getPost(slug) {
  return getAllPosts().find((p) => p.slug === slug);
}

export function byCategory(slug, limit) {
  const list = getAllPosts().filter((p) => p.category === slug);
  return limit ? list.slice(0, limit) : list;
}

export function related(post, limit = 3) {
  const all = getAllPosts().filter((p) => p.slug !== post.slug);
  const tags = new Set((post.tags || []).map((t) => t.toLowerCase()));
  const scored = all
    .map((p) => ({ p, s: (p.tags || []).filter((t) => tags.has(t.toLowerCase())).length * 3 + (p.category === post.category ? 1 : 0) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || new Date(b.p.publishedAt) - new Date(a.p.publishedAt));
  return scored.slice(0, limit).map((x) => x.p);
}

// "Trending" = stories covered by the most outlets, weighted by importance and freshness.
export function trending(limit = 10) {
  const now = Date.now();
  return [...getAllPosts()]
    .filter((p) => p.type !== 'explainer')
    .map((p) => {
      const hours = (now - new Date(p.publishedAt)) / 36e5;
      return { p, s: (p.sourceCount || 1) * 2 + (p.importance || 5) - Math.min(hours, 72) / 6 };
    })
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.p);
}

export const PAGE_SIZE = 30;

export function tagSlug(tag) {
  return tag.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// All tags with their posts, e.g. { slug: 'climate', name: 'Climate', posts: [...] }
export function allTags() {
  const map = new Map();
  for (const p of getAllPosts()) {
    for (const t of p.tags || []) {
      const slug = tagSlug(t);
      if (!slug) continue;
      if (!map.has(slug)) map.set(slug, { slug, name: t, posts: [] });
      map.get(slug).posts.push(p);
    }
  }
  return [...map.values()].sort((a, b) => b.posts.length - a.posts.length);
}

export function getTag(slug) {
  return allTags().find((t) => t.slug === slug);
}

export function pageCount(list) {
  return Math.max(1, Math.ceil(list.length / PAGE_SIZE));
}

export function pageOf(list, n) {
  return list.slice((n - 1) * PAGE_SIZE, n * PAGE_SIZE);
}

export function timeAgo(iso) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso)) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return formatDate(iso);
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function formatDateTime(iso) {
  const d = new Date(iso);
  return `${formatDate(iso)}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} GMT`;
}

export function hhmm(iso) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
}

// Stories with a licensed photo go to picture-led slots; the rest go to headline-only slots.
export const hasImage = (p) => Boolean(p?.image?.src);
export const withImage = (list) => list.filter(hasImage);
export const textFirst = (list) => [...list.filter((p) => !hasImage(p)), ...list.filter(hasImage)];

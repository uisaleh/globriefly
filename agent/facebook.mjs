import { env } from './config.mjs';
import { categoryBySlug } from '../site.config.mjs';
import { fetchWithTimeout, log } from './util.mjs';

const graph = (p) => `https://graph.facebook.com/${env.FB_GRAPH_VERSION}/${p}`;

export const facebookReady = () => Boolean(env.FB_PAGE_ID && env.FB_PAGE_TOKEN);

const hashtag = (s) => '#' + s.replace(/[^A-Za-z0-9 ]/g, '').split(' ').filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join('');

export function buildCaption(post, url) {
  const cat = categoryBySlug[post.category];
  const tags = [hashtag('Globriefly'), hashtag(cat.label + ' News'), ...(post.tags || []).slice(0, 2).map(hashtag)].filter((t) => t.length > 2 && t.length < 30);
  const lines = [post.headline, '', post.socialSummary || post.standfirst, ''];
  lines.push(env.FB_LINK_IN === 'caption' ? `Read the full story: ${url}` : 'Full story in the first comment.');
  if (post.image?.credit) lines.push('', `Photo: ${post.image.credit}${post.image.license ? ` (${post.image.license})` : ''}`);
  lines.push('', tags.join(' '));
  return lines.join('\n');
}

async function postForm(path, form) {
  form.append('access_token', env.FB_PAGE_TOKEN);
  const res = await fetchWithTimeout(graph(path), { method: 'POST', body: form }, 60000);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(`Facebook ${path}: ${data.error?.message || res.status}`);
  return data;
}

// Upload the photocard as a Page photo post, then add the article link as the first comment.
export async function shareToFacebook(post, png, url) {
  const form = new FormData();
  form.append('source', new Blob([png], { type: 'image/png' }), `${post.slug}.png`);
  form.append('caption', buildCaption(post, url));
  form.append('published', 'true');
  const photo = await postForm(`${env.FB_PAGE_ID}/photos`, form);
  const postId = photo.post_id || photo.id;
  if (env.FB_LINK_IN !== 'caption') {
    try {
      const c = new FormData();
      c.append('message', `Read the full story: ${url}`);
      await postForm(`${postId}/comments`, c);
    } catch (e) {
      log('comment failed (needs pages_manage_engagement permission):', e.message);
    }
  }
  return postId;
}

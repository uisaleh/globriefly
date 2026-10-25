// Make a framed reel from a video and (optionally) post it to the Facebook Page as a Reel.
// Inputs (env): REEL_VIDEO  = direct link to a video file, or a path in this repo (e.g. reels-inbox/clip.mp4)
//               REEL_STORY  = story slug or link (fills headline, category, date, link) — optional
//               REEL_HEADLINE / REEL_CATEGORY = use these when there is no story
//               REEL_CREDIT = who made the video (shown on the frame), REEL_START / REEL_SECONDS = trim
//               REEL_POST   = "yes" to publish on Facebook
// Writes public/reels/<name>.mp4 and content/state/reel.log
import fs from 'node:fs';
import path from 'node:path';
import { makeReel, postReel } from './reel.mjs';
import { buildCaption } from './facebook.mjs';
import { env } from './config.mjs';
import { POSTS_DIR, ROOT, readJSON, slugify, fetchWithTimeout, log } from './util.mjs';
import { categoryBySlug } from '../site.config.mjs';

const lines = [];
const say = (s) => { lines.push(s); log(s); };
const E = process.env;
const done = (code = 0) => {
  fs.mkdirSync(path.join(ROOT, 'content', 'state'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'content', 'state', 'reel.log'), lines.join('\n') + '\n');
  process.exit(code);
};

try {
  const src = (E.REEL_VIDEO || '').trim();
  if (!src) { say('✗ No video given'); done(1); }
  let input = src;
  if (/^https?:\/\//i.test(src)) {
    const res = await fetchWithTimeout(src, { headers: { 'User-Agent': 'Mozilla/5.0' } }, 120000);
    const type = res.headers.get('content-type') || '';
    if (!res.ok || /text\/html/i.test(type)) { say(`✗ That link is not a direct video file (${res.status} ${type}). Upload the video instead.`); done(1); }
    input = path.join(ROOT, '.cache', 'reel-input');
    fs.mkdirSync(path.dirname(input), { recursive: true });
    fs.writeFileSync(input, Buffer.from(await res.arrayBuffer()));
    say(`downloaded video (${Math.round(fs.statSync(input).size / 1048576)} MB)`);
  } else {
    input = path.join(ROOT, src);
    if (!fs.existsSync(input)) { say(`✗ File not found in the repo: ${src}`); done(1); }
  }

  let post;
  const slug = (E.REEL_STORY || '').trim().replace(/\/+$/, '').split('/').pop();
  if (slug) {
    const file = path.join(POSTS_DIR, `${slug}.json`);
    if (!fs.existsSync(file)) { say(`✗ Story not found: ${slug}`); done(1); }
    post = readJSON(file);
  } else {
    post = { slug: slugify(E.REEL_HEADLINE || 'globriefly-reel').slice(0, 60), headline: E.REEL_HEADLINE || 'Globriefly', category: categoryBySlug[E.REEL_CATEGORY] ? E.REEL_CATEGORY : 'world', publishedAt: new Date().toISOString(), tags: [] };
  }
  if (E.REEL_HEADLINE && slug) post.headline = E.REEL_HEADLINE;
  if (E.REEL_CREDIT) post.videoCredit = E.REEL_CREDIT;

  const name = `${post.slug}-${Date.now().toString(36)}`;
  const out = path.join(ROOT, 'public', 'reels', `${name}.mp4`);
  await makeReel({ input, post, out, start: Number(E.REEL_START) || 0, seconds: Number(E.REEL_SECONDS) || 0 });
  say(`✓ reel made: ${env.SITE_URL}/reels/${name}.mp4`);

  const url = post.standfirst ? `${env.SITE_URL}/news/${post.slug}/` : env.SITE_URL;
  let caption = post.standfirst ? buildCaption(post, url).replace('Full story in the first comment.', `Full story: ${url}`) : `${post.headline}\n\nMore news: ${url}\n\n#Globriefly #News`;
  caption = caption.split('\n').filter((l) => !/^Photo:/.test(l)).join('\n').replace(/\n{3,}/g, '\n\n');
  if (E.REEL_CREDIT) caption = caption.replace(/(\n\n#)/, `\n\nVideo: ${E.REEL_CREDIT}$1`);
  fs.writeFileSync(out.replace(/\.mp4$/, '.txt'), caption + '\n');
  say('caption saved next to the video (.txt)');

  if (/^y(es)?$/i.test(E.REEL_POST || '')) {
    if (!env.FB_PAGE_ID || !env.FB_PAGE_TOKEN) { say('✗ Facebook keys missing — reel made but not posted'); done(0); }
    const id = await postReel(out, caption);
    say(`✓ posted to Facebook as a Reel (video id ${id})`);
  } else {
    say('not posted (choose "yes" to publish on Facebook)');
  }
  if (!/^https?:/i.test(src) && src.startsWith('reels-inbox/')) { fs.unlinkSync(input); say('removed the uploaded source video from reels-inbox'); }
  done(0);
} catch (e) {
  say(`✗ ${e.message}`);
  done(1);
}

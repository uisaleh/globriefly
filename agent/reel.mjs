// Puts a video into the Globriefly reel frame (1080×1920, 30 fps, H.264 + AAC) and can post it as a Facebook Reel.
// The video is fitted inside the window with a blurred fill behind it, so landscape, square and vertical
// clips all work. Sound is kept. Reels are capped at 90 seconds.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { renderReelFrame, REEL } from './card.mjs';
import { env } from './config.mjs';
import { fetchWithTimeout, log } from './util.mjs';
import { categoryBySlug } from '../site.config.mjs';

const MAX_SECONDS = 90;

function probe(file) {
  try {
    const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type', '-of', 'json', file]).toString();
    const j = JSON.parse(out);
    return { duration: Number(j.format?.duration) || 0, hasAudio: (j.streams || []).some((s) => s.codec_type === 'audio') };
  } catch {
    return { duration: 0, hasAudio: false };
  }
}

export async function makeReel({ input, post, out, start = 0, seconds = 0 }) {
  const { W, H, X, Y, VW, VH } = REEL;
  const tmp = path.join(path.dirname(out), `.frame-${process.pid}.png`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(tmp, await renderReelFrame(post));
  const info = probe(input);
  const length = Math.min(MAX_SECONDS, seconds || Math.max(0, (info.duration || MAX_SECONDS) - start));
  const color = (categoryBySlug[post.category] || categoryBySlug.world).color.replace('#', '0x');
  const filter = [
    `[0:v]fps=30,split[a][b]`,
    `[a]scale=${VW}:${VH}:force_original_aspect_ratio=increase,crop=${VW}:${VH},boxblur=24:2,eq=brightness=-0.12[bg]`,
    `[b]scale=${VW}:${VH}:force_original_aspect_ratio=decrease[fg]`,
    `[bg][fg]overlay=(W-w)/2:(H-h)/2[win]`,
    `color=c=${color}:s=${W}x${H}:r=30[base]`,
    `[base][win]overlay=${X}:${Y}:shortest=1[v1]`,
    `[v1][1:v]overlay=0:0,format=yuv420p[v]`,
  ].join(';');
  const args = ['-y', '-ss', String(start), '-t', String(length), '-i', input, '-loop', '1', '-i', tmp];
  // Clips without sound get a silent track (Facebook expects an audio stream).
  if (!info.hasAudio) args.push('-f', 'lavfi', '-t', String(length), '-i', 'anullsrc=r=44100:cl=stereo');
  args.push('-filter_complex', filter, '-map', '[v]', '-map', info.hasAudio ? '0:a:0' : '2:a',
    '-c:a', 'aac', '-b:a', '128k', '-ar', '44100',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-profile:v', 'high', '-movflags', '+faststart',
    '-t', String(length), out);
  execFileSync('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
  fs.unlinkSync(tmp);
  log(`reel ready: ${out} (${Math.round(fs.statSync(out).size / 1024 / 1024 * 10) / 10} MB, ${Math.round(length)} s)`);
  return out;
}

// Facebook Reels publishing (Graph API): start → upload bytes → finish.
export async function postReel(file, description) {
  const g = (p) => `https://graph.facebook.com/${env.FB_GRAPH_VERSION}/${p}`;
  // Page token from the stored key (same exchange as photo posts)
  let token = env.FB_PAGE_TOKEN;
  try {
    const r = await (await fetchWithTimeout(`${g(env.FB_PAGE_ID)}?fields=access_token&access_token=${encodeURIComponent(token)}`, {}, 20000)).json();
    if (r.access_token) token = r.access_token;
  } catch {}
  const start = await (await fetchWithTimeout(g(`${env.FB_PAGE_ID}/video_reels`), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ upload_phase: 'start', access_token: token }),
  }, 30000)).json();
  if (!start.video_id) throw new Error(`Reel start failed: ${start.error?.message || JSON.stringify(start)}`);
  const bytes = fs.readFileSync(file);
  const up = await (await fetchWithTimeout(`https://rupload.facebook.com/video-upload/${env.FB_GRAPH_VERSION}/${start.video_id}`, {
    method: 'POST',
    headers: { Authorization: `OAuth ${token}`, offset: '0', file_size: String(bytes.length), 'Content-Type': 'application/octet-stream' },
    body: bytes,
  }, 300000)).json();
  if (!up.success) throw new Error(`Reel upload failed: ${up.error?.message || JSON.stringify(up)}`);
  const fin = await (await fetchWithTimeout(g(`${env.FB_PAGE_ID}/video_reels`), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ upload_phase: 'finish', video_id: start.video_id, video_state: 'PUBLISHED', description, access_token: token }),
  }, 60000)).json();
  if (!fin.success) throw new Error(`Reel publish failed: ${fin.error?.message || JSON.stringify(fin)}`);
  log(`✓ Reel posted (video id ${start.video_id}) — Facebook may take a few minutes to finish processing it.`);
  return start.video_id;
}

// Checks the Facebook connection WITHOUT posting anything.
// Writes the result (never the token) to content/state/facebook-check.log.
import fs from 'node:fs';
import path from 'node:path';
import { env } from './config.mjs';
import { fetchWithTimeout, ROOT } from './util.mjs';

const lines = [];
const say = (s) => { lines.push(s); console.log(s); };
const g = (p) => `https://graph.facebook.com/${env.FB_GRAPH_VERSION}/${p}`;
const get = async (u) => (await fetchWithTimeout(u, {}, 20000)).json().catch(() => ({}));

say(`Facebook check — ${new Date().toISOString()}`);
if (!env.FB_PAGE_ID) say('✗ FB_PAGE_ID secret is missing');
const raw = process.env.FB_PAGE_TOKEN || '';
if (!raw) say('✗ FB_PAGE_TOKEN secret is missing');
else say(`token secret: ${raw.length} characters saved, ${env.FB_PAGE_TOKEN.length} usable${raw.trim().startsWith('EAA') ? '' : ' (extra characters were stripped)'}`);
if (raw && !env.FB_PAGE_TOKEN) say('✗ no token starting with EAA found in FB_PAGE_TOKEN');
if (env.FB_PAGE_ID && env.FB_PAGE_TOKEN) {
  const t = encodeURIComponent(env.FB_PAGE_TOKEN);
  const dbg = await get(g(`debug_token?input_token=${t}&access_token=${t}`));
  const d = dbg.data || {};
  if (dbg.error) say(`token check error: ${dbg.error.message}`);
  else {
    say(`token type: ${d.type || '?'} · valid: ${d.is_valid} · expires: ${d.expires_at ? (d.expires_at === 0 ? 'never' : new Date(d.expires_at * 1000).toISOString()) : 'never'}`);
    const scopes = d.scopes || [];
    say(`permissions: ${scopes.join(', ') || '(none listed)'}`);
    for (const need of ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list', 'pages_manage_engagement']) {
      say(`${scopes.includes(need) ? '✓' : '✗'} ${need}${need === 'pages_manage_engagement' ? ' (only needed for the link-in-first-comment)' : ''}`);
    }
  }
  const page = await get(g(`${env.FB_PAGE_ID}?fields=name,access_token,tasks&access_token=${t}`));
  if (page.error) say(`✗ Page lookup failed: ${page.error.message}`);
  else {
    say(`✓ Page found: ${page.name}`);
    say(page.access_token ? '✓ Page token obtained — auto-posting will work' : 'ℹ token is already a Page token (or Page token not returned)');
    if (page.tasks) say(`Page tasks: ${page.tasks.join(', ')}`);
  }
}
fs.mkdirSync(path.join(ROOT, 'content', 'state'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'content', 'state', 'facebook-check.log'), lines.join('\n') + '\n');
process.exit(0);

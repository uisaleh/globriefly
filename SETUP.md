# Globriefly — setup guide

Globriefly is a fully automatic world-news site. Every hour a free GitHub Actions job:

1. reads ~30 free news RSS feeds (BBC, Al Jazeera, Guardian, NPR, DW, France 24, UN, CNBC, TechCrunch, The Verge, NASA, WHO, ESPN, Variety …),
2. groups headlines about the same story and picks the ones most outlets are covering,
3. writes a full, original article (600–900 words: key points, sections, timeline) combining facts from several sources,
4. finds a free, properly licensed photo (Wikimedia Commons → Pexels → Unsplash) and credits it,
5. publishes it to the site in the right category,
6. renders the branded photocard for that category and posts it to your Facebook Page with a short summary, then adds the article link as the first comment.

Once a day it also writes an "Explained" piece about the biggest story.

Everything runs on free tiers: **GitHub** (code + agent), **Vercel** (hosting), **Google Gemini** (writing), **Wikimedia/Pexels/Unsplash** (photos), **Meta Graph API** (Facebook).

---

## What you need (about 45 minutes, once)

| Account | Cost | Used for |
|---|---|---|
| GitHub | Free | Stores the site and runs the hourly agent |
| Vercel | Free (Hobby) | Hosts the website |
| Google AI Studio | Free tier | Gemini API key for writing |
| Pexels and/or Unsplash | Free | Extra photo sources (optional, recommended) |
| Facebook Page + Meta for Developers | Free | Auto-posting photocards |
| Domain (e.g. globriefly.com) | ~$10/year | Your web address (optional at first — Vercel gives a free `.vercel.app` address) |

---

## Step 1 — Put the code on GitHub

1. Create a free account at <https://github.com> if you don't have one.
2. Click **New repository** → name it `globriefly` → choose **Public** → **Create repository**.
   *Why public?* Public repos get unlimited free Actions minutes. Your API keys stay secret (they live in Secrets, never in the code). A private repo gets 2,000 free minutes a month, which is not enough for hourly runs.
3. Unzip `globriefly.zip` on your computer. On the new repo page click **uploading an existing file**, drag in **everything inside the unzipped folder** (including the hidden `.github` folder — on Mac press `Cmd+Shift+.` to show it), then **Commit changes**.
   Easier option: install **GitHub Desktop**, choose *Add existing repository*, select the folder and click *Publish*.

## Step 2 — Host the site on Vercel

1. Go to <https://vercel.com> → **Sign up with GitHub**.
2. **Add New → Project** → import `globriefly`. Framework is detected as **Next.js**. Leave the build settings as they are.
3. Under **Environment Variables** add:
   - `SITE_URL` = `https://globriefly.com` (or your `https://globriefly.vercel.app` address until you have a domain)
   - `FACEBOOK_PAGE_URL` = your Facebook Page link
4. Click **Deploy**. In about a minute the site is live with sample stories.
5. Domain: **Project → Settings → Domains → Add** `globriefly.com` and follow the DNS instructions from your domain registrar.

Every time the agent commits new stories, Vercel rebuilds the site automatically (about 1 minute).

## Step 2b — Contact form to your Gmail (already set up)

The Contact page form (name, email, phone, reason, message) sends every message to **hellosalehahmed02@gmail.com** through Web3Forms (free for 250 messages a month). Your access key is already saved in `site.config.mjs`, so it works as soon as the site is live. No Vercel setting is needed.

After your first deploy, open `/contact/` and send yourself a test message. The first one may land in Gmail's Spam or Promotions tab: mark it **Not spam** so the rest arrive in your inbox.

To use a different inbox later, create a new key at <https://web3forms.com> and replace it in `site.config.mjs` (or set `NEXT_PUBLIC_WEB3FORMS_KEY` in Vercel, which overrides it). The key is safe to be public: it can only send to the address it was created for. Your Gmail address is never shown on the website.

## Step 3 — Get the free writing key (Gemini)

1. Open <https://aistudio.google.com/apikey> and sign in with Google.
2. **Create API key** → copy it.

Google sets free-tier limits per project and shows them in AI Studio. The agent writes 3 stories per run by default (≈ 72 a day). If you hit the free limit (you'll see `429` errors in the Actions log), lower `MAX_STORIES_PER_RUN` to 1–2, or add a free Groq key as a backup writer (see Step 6).

## Step 4 — Free photo keys (optional but recommended)

Wikimedia Commons works without a key and gives real photos of the actual people and places in the news. Pexels and Unsplash fill the gaps for general topics.

- Pexels: <https://www.pexels.com/api/> → *Get started* → copy your API key.
- Unsplash: <https://unsplash.com/developers> → *New application* → copy the **Access Key**.

### About "original" news photos
The agent never copies photos from news outlets (Reuters, AP, Getty, BBC, etc.). Those photos are licensed to the outlet that paid for them; reusing them leads to copyright claims, and Facebook removes posts and can restrict Pages that repeatedly post them. Instead the agent picks real photographs that are licensed for reuse — mostly from Wikimedia Commons, which has millions of genuine photos of world leaders, cities, landmarks, events and organisations — and credits the photographer under every image and in every Facebook post, as the licence requires.

If you ever buy or obtain the right to use a specific photo, open the story's file in `content/posts/` and replace the `image` → `src` value with that photo's address.

## Step 5 — Facebook Page auto-posting

1. **Create the Page**: <https://www.facebook.com/pages/create> → name *Globriefly* → category *Media/News Company*. Use the logo and a cover image from the design.
2. **Create a Meta app**: go to <https://developers.facebook.com/apps> → **Create app** → use case **Other** → type **Business** → name it *Globriefly Publisher*.
3. **Get a Page token** in the Graph API Explorer (<https://developers.facebook.com/tools/explorer>):
   1. Select your app at the top right.
   2. Click **Get Token → Get User Access Token** and tick: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `pages_manage_engagement`. Approve for your Globriefly Page.
   3. Make the token long-lived: open **Tools → Access Token Debugger**, paste the token, click **Extend Access Token**, copy the new token.
   4. Back in the Explorer, paste the long-lived token, then run the query `me/accounts`. Find Globriefly in the result and copy its `access_token` (this Page token doesn't expire) and its `id` (your Page ID).
4. Because you're an admin of both the app and the Page, posting works without Meta's App Review.

## Step 6 — Add the keys to GitHub

Repo → **Settings → Secrets and variables → Actions**.

**Secrets** tab → *New repository secret* for each:

| Name | Value |
|---|---|
| `GEMINI_API_KEY` | from Step 3 |
| `PEXELS_API_KEY` | from Step 4 (optional) |
| `UNSPLASH_ACCESS_KEY` | from Step 4 (optional) |
| `FB_PAGE_ID` | Page ID from Step 5 |
| `FB_PAGE_TOKEN` | Page access token from Step 5 |
| `GROQ_API_KEY` | optional backup writer, free at <https://console.groq.com> |

**Variables** tab → *New repository variable*:

| Name | Value |
|---|---|
| `SITE_URL` | same address as in Vercel, e.g. `https://globriefly.com` |
| `MAX_STORIES_PER_RUN` | `3` (stories per hour) |
| `REQUIRE_REVIEW` | `false` = publish automatically, `true` = save as drafts for you to approve |
| `GROQ_MODEL` | only if you added a Groq key — copy a model ID from the Groq console |
| `FB_LINK_IN` | `comment` (link in first comment, default) or `caption` |

## Step 7 — Start the agent

Repo → **Actions** tab → enable workflows if asked → **News agent** → **Run workflow**.

Watch the log: you'll see feeds being read, stories written (`✓ published: /news/...`), the commit, a 3-minute wait for Vercel, then `✓ shared:` for each Facebook post. After that it runs by itself every hour.

The sample stories disappear automatically as soon as the first real story is published.

---

## Step 8 — Get indexed by Google, Bing and AI assistants

The site is built for indexing:
- XML sitemap with every story, section, topic and archive page, including photos: `/sitemap.xml`
- Google News sitemap with the last 48 hours of stories: `/news-sitemap.xml`
- `robots.txt` open to all search engines and AI crawlers
- `llms.txt` (a guide to the site for ChatGPT, Claude, Perplexity and others) and `llms-full.txt` (full text of the latest 100 stories)
- NewsArticle, Breadcrumb, Organization and WebSite structured data on every page
- Alt text on every photo, plus large image previews allowed for Google Discover
- Topic pages (`/tag/...`), paginated section archives and a full archive, so no story is ever orphaned

Do this once the site is on your real domain:
1. **Google Search Console** — <https://search.google.com/search-console> → add `globriefly.com` (Domain property) → verify with the DNS record it gives you → **Sitemaps** → submit `sitemap.xml` and `news-sitemap.xml`.
2. **Bing Webmaster Tools** — <https://www.bing.com/webmasters> → *Import from Google Search Console* (one click). Bing also feeds ChatGPT search and Copilot.
3. **Google News** — <https://publishercenter.google.com> → add your publication, link your site and Facebook Page. Approval isn't guaranteed, but original reporting, clear About/Contact/Editorial pages (already built) help.

## Daily use

- **Review mode**: set `REQUIRE_REVIEW` to `true`. New stories are saved with `"status": "draft"`. To publish one, open it in `content/posts/` on GitHub, click the pencil icon, change `draft` to `published` and commit. It goes live and is shared to Facebook on the next run. Recommended for the first week or two while you check quality.
- **Fix or remove a story**: edit or delete its file in `content/posts/` on GitHub. The site updates in about a minute.
- **Stop Facebook posting for one story**: add `"facebook": { "skip": true }` to its file before it is shared.
- **Pause everything**: Actions → News agent → ⋯ → *Disable workflow*.

## Customising

- **Feeds**: `agent/config.mjs` → `feeds`. Add any RSS feed with a category hint.
- **Categories, colours, site name, tagline**: `site.config.mjs`.
- **Writing style and rules**: `agent/llm.mjs` → `SYSTEM`.
- **Photocard design**: `agent/card.mjs`. Run `npm install` then `npm run card` locally to render previews into `.cache/cards/`.
- **Posting frequency**: the `cron` line in `.github/workflows/news-agent.yml` (`7 * * * *` = every hour).

## Newsletter (free)

Create a free account at Buttondown, MailerLite or Brevo, copy the form's action URL and add it in Vercel as `NEXT_PUBLIC_NEWSLETTER_ACTION`, then redeploy.

## Making money later

- **Google AdSense**: apply once the site has 30+ articles and a few weeks of traffic. Ad slots are already in the article sidebar.
- **Facebook**: once the Page grows, turn on monetisation in Meta Business Suite.

## Good to know

- Each article credits the outlets it draws on in a short "Additional reporting from …" line. That's standard practice at major news sites and protects you if a publisher ever questions a story.
- The agent checks every article against its sources and rewrites it if wording is too close, so content stays original.
- AI writers can occasionally get a detail wrong. Review mode, or a quick daily read of what was published, keeps quality high.

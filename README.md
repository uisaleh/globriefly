# Globriefly — The world, briefly.

An automatic world-news site: an hourly agent collects news from free RSS feeds, writes original full articles, picks licensed photos, publishes by category, and posts branded photocards to Facebook.

- **Site**: Next.js static export (`app/`, `components/`, `site.config.mjs`)
- **Agent**: `agent/` — `run.mjs` (collect → write → image → publish), `share.mjs` (Facebook)
- **Content**: one JSON file per story in `content/posts/`
- **Automation**: `.github/workflows/news-agent.yml` (hourly)

Start here → **[SETUP.md](SETUP.md)**

```bash
npm install
npm run dev        # site at http://localhost:3000
node --env-file=.env agent/run.mjs   # run the agent once with your keys (see .env.example)
npm run card       # render sample photocards into .cache/cards
```

// Agent settings. Secrets come from environment variables (GitHub Actions secrets).
export const env = {
  SITE_URL: (process.env.SITE_URL || 'https://globriefly.vercel.app').replace(/\/$/, ''),

  // Writing model. Gemini has a free tier; Groq is an optional free fallback.
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODELS: (process.env.GEMINI_MODELS || 'gemini-3.6-flash,gemini-3.5-flash-lite').split(',').map((s) => s.trim()).filter(Boolean),
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || '',

  // Free image sources (optional keys; Wikimedia Commons needs no key).
  UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY || '',
  PEXELS_API_KEY: process.env.PEXELS_API_KEY || '',

  // Facebook Page publishing.
  FB_PAGE_ID: process.env.FB_PAGE_ID || '',
  FB_PAGE_TOKEN: process.env.FB_PAGE_TOKEN || '',
  FB_GRAPH_VERSION: process.env.FB_GRAPH_VERSION || 'v25.0',
  FB_LINK_IN: process.env.FB_LINK_IN || 'comment', // 'comment' or 'caption'

  // Behaviour.
  MAX_STORIES_PER_RUN: Number(process.env.MAX_STORIES_PER_RUN || 3),
  MAX_ITEM_AGE_HOURS: Number(process.env.MAX_ITEM_AGE_HOURS || 12),
  REQUIRE_REVIEW: /^(1|true|yes)$/i.test(process.env.REQUIRE_REVIEW || 'false'),
  DAILY_EXPLAINER: !/^(0|false|no)$/i.test(process.env.DAILY_EXPLAINER || 'true'),
  DRY_RUN: /^(1|true|yes)$/i.test(process.env.DRY_RUN || 'false'),
};

// Free public RSS feeds. `hint` nudges the category; the writer still decides.
// Add or remove feeds freely.
export const feeds = [
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', hint: 'world' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', hint: 'world' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', hint: 'world' },
  { name: 'NPR', url: 'https://feeds.npr.org/1004/rss.xml', hint: 'world' },
  { name: 'DW', url: 'https://rss.dw.com/rdf/rss-en-all', hint: 'world' },
  { name: 'France 24', url: 'https://www.france24.com/en/rss', hint: 'world' },
  { name: 'UN News', url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml', hint: 'world' },
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/politics/rss.xml', hint: 'politics' },
  { name: 'NPR', url: 'https://feeds.npr.org/1014/rss.xml', hint: 'politics' },
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', hint: 'business' },
  { name: 'CNBC', url: 'https://www.cnbc.com/id/100727362/device/rss/rss.html', hint: 'business' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/business/rss', hint: 'business' },
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', hint: 'technology' },
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', hint: 'technology' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', hint: 'technology' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', hint: 'technology' },
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', hint: 'science' },
  { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/top.xml', hint: 'science' },
  { name: 'NASA', url: 'https://www.nasa.gov/news-release/feed/', hint: 'science' },
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/health/rss.xml', hint: 'health' },
  { name: 'WHO', url: 'https://www.who.int/rss-feeds/news-english.xml', hint: 'health' },
  { name: 'NPR', url: 'https://feeds.npr.org/1128/rss.xml', hint: 'health' },
  { name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/rss.xml', hint: 'sports' },
  { name: 'ESPN', url: 'https://www.espn.com/espn/rss/news', hint: 'sports' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/sport/rss', hint: 'sports' },
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml', hint: 'entertainment' },
  { name: 'Variety', url: 'https://variety.com/feed/', hint: 'entertainment' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/culture/rss', hint: 'entertainment' },
];

// Keep each category represented over the day.
export const categoryQuota = { world: 3, politics: 2, business: 2, technology: 2, science: 1, health: 1, sports: 2, entertainment: 1 };

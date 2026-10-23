// Agent settings. Secrets come from environment variables (GitHub Actions secrets).
export const env = {
  SITE_URL: (process.env.SITE_URL || 'https://globriefly.vercel.app').replace(/\/$/, ''),

  // Writing model. Gemini has a free tier; Groq is an optional free fallback.
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODELS: (process.env.GEMINI_MODELS || 'gemini-3.5-flash-lite,gemini-3.6-flash').split(',').map((s) => s.trim()).filter(Boolean),
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || '',

  // Free image sources (optional keys; Wikimedia Commons needs no key).
  UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY || '',
  PEXELS_API_KEY: process.env.PEXELS_API_KEY || '',

  // Facebook Page publishing.
  FB_PAGE_ID: (process.env.FB_PAGE_ID || '').replace(/[^0-9]/g, ''),
  // Tolerate copy-paste extras: quotes, spaces, line breaks, a leading "access_token": label, trailing comma.
  FB_PAGE_TOKEN: ((process.env.FB_PAGE_TOKEN || '').match(/EAA[A-Za-z0-9]+/) || [''])[0],
  FB_GRAPH_VERSION: process.env.FB_GRAPH_VERSION || 'v25.0',
  FB_LINK_IN: process.env.FB_LINK_IN || 'comment', // 'comment' or 'caption'

  // Behaviour.
  MAX_STORIES_PER_RUN: Math.min(5, Number(process.env.MAX_STORIES_PER_RUN || 3)),
  // Optional: only pick stories from these categories this run, e.g. "science,entertainment"
  FOCUS_CATEGORIES: (process.env.FOCUS_CATEGORIES || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
  MAX_ITEM_AGE_HOURS: Number(process.env.MAX_ITEM_AGE_HOURS || 12),
  REQUIRE_REVIEW: /^(1|true|yes)$/i.test(process.env.REQUIRE_REVIEW || 'false'),
  DAILY_EXPLAINER: !/^(0|false|no)$/i.test(process.env.DAILY_EXPLAINER || 'true'),
  DRY_RUN: /^(1|true|yes)$/i.test(process.env.DRY_RUN || 'false'),
};

// Free public RSS feeds. `hint` nudges the category; the writer still decides.
// Add or remove feeds freely.
// Tested with: node agent/check-feeds.mjs (Actions → Check news feeds). paywall: true = used to find and rank
// stories, but free-to-read outlets are read first when writing.
export const feeds = [
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', hint: 'world' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', hint: 'world' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', hint: 'world' },
  { name: 'NPR', url: 'https://feeds.npr.org/1004/rss.xml', hint: 'world' },
  { name: 'DW', url: 'https://rss.dw.com/rdf/rss-en-all', hint: 'world' },
  { name: 'France 24', url: 'https://www.france24.com/en/rss', hint: 'world' },
  { name: 'Sky News', url: 'https://feeds.skynews.com/feeds/rss/world.xml', hint: 'world' },
  { name: 'CBS News', url: 'https://www.cbsnews.com/latest/rss/world', hint: 'world' },
  { name: 'ABC News', url: 'https://abcnews.go.com/abcnews/internationalheadlines', hint: 'world' },
  { name: 'New York Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', hint: 'world', paywall: true },
  { name: 'ABC News Australia', url: 'https://www.abc.net.au/news/feed/2942460/rss.xml', hint: 'world' },
  { name: 'Euronews', url: 'https://www.euronews.com/rss?level=theme&name=news', hint: 'world' },
  { name: 'CNA', url: 'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6311', hint: 'world' },
  { name: 'The Hindu', url: 'https://www.thehindu.com/news/international/feeder/default.rss', hint: 'world' },
  { name: 'South China Morning Post', url: 'https://www.scmp.com/rss/91/feed', hint: 'world', paywall: true },
  { name: 'RNZ', url: 'https://www.rnz.co.nz/rss/world.xml', hint: 'world' },
  { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms', hint: 'world' },
  { name: 'The Japan Times', url: 'https://www.japantimes.co.jp/feed/', hint: 'world', paywall: true },
  { name: 'Africanews', url: 'https://www.africanews.com/feed/rss', hint: 'world' },
  { name: 'The Conversation', url: 'https://theconversation.com/global/articles.atom', hint: 'world' },
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/politics/rss.xml', hint: 'politics' },
  { name: 'NPR', url: 'https://feeds.npr.org/1014/rss.xml', hint: 'politics' },
  { name: 'Politico', url: 'https://rss.politico.com/politics-news.xml', hint: 'politics' },
  { name: 'The Hill', url: 'https://thehill.com/news/feed/', hint: 'politics' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/politics/rss', hint: 'politics' },
  { name: 'New York Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml', hint: 'politics', paywall: true },
  { name: 'Politico Europe', url: 'https://www.politico.eu/feed/', hint: 'politics', paywall: true },
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', hint: 'business' },
  { name: 'CNBC', url: 'https://www.cnbc.com/id/100727362/device/rss/rss.html', hint: 'business' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/business/rss', hint: 'business' },
  { name: 'New York Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', hint: 'business', paywall: true },
  { name: 'MarketWatch', url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories', hint: 'business', paywall: true },
  { name: 'Fortune', url: 'https://fortune.com/feed/', hint: 'business', paywall: true },
  { name: 'Sky News', url: 'https://feeds.skynews.com/feeds/rss/business.xml', hint: 'business' },
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', hint: 'technology' },
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', hint: 'technology' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', hint: 'technology' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', hint: 'technology' },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss', hint: 'technology', paywall: true },
  { name: 'Engadget', url: 'https://www.engadget.com/rss.xml', hint: 'technology' },
  { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', hint: 'technology' },
  { name: 'New York Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', hint: 'technology', paywall: true },
  { name: 'The Guardian', url: 'https://www.theguardian.com/technology/rss', hint: 'technology' },
  { name: 'ZDNET', url: 'https://www.zdnet.com/news/rss.xml', hint: 'technology' },
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', hint: 'science' },
  { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/top.xml', hint: 'science' },
  { name: 'NASA', url: 'https://www.nasa.gov/news-release/feed/', hint: 'science' },
  { name: 'New York Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml', hint: 'science', paywall: true },
  { name: 'New Scientist', url: 'https://www.newscientist.com/feed/home/', hint: 'science', paywall: true },
  { name: 'Space.com', url: 'https://www.space.com/feeds/all', hint: 'science' },
  { name: 'Phys.org', url: 'https://phys.org/rss-feed/', hint: 'science' },
  { name: 'Live Science', url: 'https://www.livescience.com/feeds/all', hint: 'science' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/science/rss', hint: 'science' },
  { name: 'Scientific American', url: 'http://rss.sciam.com/ScientificAmerican-Global', hint: 'science', paywall: true },
  { name: 'ESA', url: 'https://www.esa.int/rssfeed/Our_Activities/Space_News', hint: 'science' },
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/health/rss.xml', hint: 'health' },
  { name: 'WHO', url: 'https://www.who.int/rss-feeds/news-english.xml', hint: 'health' },
  { name: 'NPR', url: 'https://feeds.npr.org/1128/rss.xml', hint: 'health' },
  { name: 'New York Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml', hint: 'health', paywall: true },
  { name: 'STAT', url: 'https://www.statnews.com/feed/', hint: 'health', paywall: true },
  { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/health_medicine.xml', hint: 'health' },
  { name: 'KFF Health News', url: 'https://kffhealthnews.org/feed/', hint: 'health' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/society/health/rss', hint: 'health' },
  { name: 'Medical Xpress', url: 'https://medicalxpress.com/rss-feed/', hint: 'health' },
  { name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/rss.xml', hint: 'sports' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/sport/rss', hint: 'sports' },
  { name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', hint: 'sports' },
  { name: 'Yahoo Sports', url: 'https://sports.yahoo.com/rss/', hint: 'sports' },
  { name: 'CBS Sports', url: 'https://www.cbssports.com/rss/headlines/', hint: 'sports' },
  { name: 'ESPN Cricinfo', url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml', hint: 'sports' },
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml', hint: 'entertainment' },
  { name: 'Variety', url: 'https://variety.com/feed/', hint: 'entertainment' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/culture/rss', hint: 'entertainment' },
  { name: 'The Hollywood Reporter', url: 'https://www.hollywoodreporter.com/feed/', hint: 'entertainment', paywall: true },
  { name: 'Deadline', url: 'https://deadline.com/feed/', hint: 'entertainment' },
  { name: 'Rolling Stone', url: 'https://www.rollingstone.com/feed/', hint: 'entertainment', paywall: true },
  { name: 'Billboard', url: 'https://www.billboard.com/feed/', hint: 'entertainment', paywall: true },
  { name: 'New York Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml', hint: 'entertainment', paywall: true },
  { name: 'Sky News', url: 'https://feeds.skynews.com/feeds/rss/entertainment.xml', hint: 'entertainment' },
];

// Keep each category represented over the day.
export const categoryQuota = { world: 3, politics: 2, business: 2, technology: 2, science: 1, health: 1, sports: 2, entertainment: 1 };

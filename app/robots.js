import { site } from '@/site.config.mjs';

export const dynamic = 'force-static';

// Open to every search engine and AI crawler, so stories can appear in Google, Bing, Google News and AI answers.
export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: '/ads/' }],
    sitemap: [`${site.url}/sitemap.xml`, `${site.url}/news-sitemap.xml`],
    host: site.url,
  };
}

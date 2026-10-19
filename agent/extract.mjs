import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';
import { fetchWithTimeout } from './util.mjs';

// Read the main text of a source article, used only as factual background for our own write-up.
export async function extractText(url) {
  try {
    const res = await fetchWithTimeout(url, { headers: { Accept: 'text/html' } }, 15000);
    if (!res.ok) return '';
    const html = await res.text();
    const { document } = parseHTML(html);
    const article = new Readability(document).parse();
    const text = (article?.textContent || '').replace(/\s+/g, ' ').trim();
    return text.slice(0, 7000);
  } catch {
    return '';
  }
}

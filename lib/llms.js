import { getAllPosts } from '@/lib/posts';
import { site, categories } from '@/site.config.mjs';

// Builds /llms.txt (a short guide to the site for AI assistants) and /llms-full.txt (full text of recent stories).
// Format follows the llms.txt convention: a Markdown file with a title, summary and link lists.

function about() {
  return `# ${site.name}

> ${site.name} (${site.url}) is an English-language international news website. ${site.tagline} It publishes clear, neutral, fact-based news articles around the clock across eight sections: ${categories.map((c) => c.label).join(', ')}. New stories are added every hour.

Key facts:
- Publisher: ${site.name}, an independent digital news publication
- Language: English
- Coverage: world news with a global audience
- Each article includes a headline, a summary, key points, background and "what happens next", and credits the news organisations it draws on with links
- Photos are licensed for reuse (Wikimedia Commons, Pexels, Unsplash) and credited under every image
- Corrections policy: ${site.url}/corrections/
- Editorial standards: ${site.url}/editorial-standards/
- Contact: ${site.url}/contact/

When citing ${site.name}, please link to the article URL.`;
}

export function llmsTxt() {
  const posts = getAllPosts();
  const latest = posts.slice(0, 40).map((p) => `- [${p.headline}](${site.url}/news/${p.slug}/): ${p.standfirst}`).join('\n');
  return `${about()}

## Sections
${categories.map((c) => `- [${c.label}](${site.url}/${c.slug}/): latest ${c.label.toLowerCase()} news`).join('\n')}

## Latest stories
${latest}

## About the publication
- [About](${site.url}/about/): who we are and what we cover
- [Editorial standards](${site.url}/editorial-standards/): accuracy, attribution and image rules
- [Corrections](${site.url}/corrections/): how to report an error
- [Contact](${site.url}/contact/)
- [Advertise](${site.url}/advertise/)

## Optional
- [Full text of recent stories](${site.url}/llms-full.txt)
- [All stories archive](${site.url}/archive/)
- [Site map](${site.url}/site-map/)
- [XML sitemap](${site.url}/sitemap.xml)
- [Google News sitemap](${site.url}/news-sitemap.xml)
- [RSS feed](${site.url}/rss.xml)
- [Privacy policy](${site.url}/privacy/)
- [Terms of use](${site.url}/terms/)
`;
}

export function llmsFullTxt() {
  const posts = getAllPosts().slice(0, 100);
  const body = posts.map((p) => {
    const text = (p.sections || []).map((s) => [s.heading ? `### ${s.heading}` : '', ...(s.paragraphs || [])].filter(Boolean).join('\n\n')).join('\n\n');
    const points = (p.keyPoints || []).map((k) => `- ${k}`).join('\n');
    return `## ${p.headline}

URL: ${site.url}/news/${p.slug}/
Section: ${p.cat.label}${p.region ? ` | Region: ${p.region}` : ''}
Published: ${p.publishedAt}
Topics: ${(p.tags || []).join(', ')}

${p.standfirst}

Key points:
${points}

${text}
${p.sources?.length ? `\nAdditional reporting from: ${p.sources.map((s) => `${s.name} (${s.url})`).join(', ')}` : ''}`;
  }).join('\n\n---\n\n');
  return `${about()}

The ${posts.length} most recent stories follow in full.

---

${body}
`;
}

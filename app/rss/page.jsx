import StaticPage from '@/components/StaticPage';
import CopyField from '@/components/CopyField';
import { site } from '@/site.config.mjs';

export const metadata = {
  title: 'RSS feed',
  description: 'Follow every new Globriefly story in your favourite news reader.',
  alternates: { canonical: '/rss/', types: { 'application/rss+xml': '/rss.xml' } },
};

export default function RssPage() {
  const feed = `${site.url}/rss.xml`;
  const enc = encodeURIComponent(feed);
  return (
    <StaticPage title="Follow Globriefly by RSS">
      <p>Get every new story the moment it is published, in the news reader you already use. Copy the feed address below and add it to your reader, or use one of the buttons.</p>
      <CopyField value={feed} />
      <div className="feed-buttons">
        <a className="btn btn-dark" href={`https://feedly.com/i/subscription/feed/${enc}`} target="_blank" rel="noopener">Add to Feedly</a>
        <a className="btn btn-dark" href={`https://www.inoreader.com/?add_feed=${enc}`} target="_blank" rel="noopener">Add to Inoreader</a>
        <a className="btn" href="/rss.xml" style={{ background: 'transparent', color: 'var(--ink)', border: '1px solid var(--line)' }}>Open the raw feed</a>
      </div>
      <h2>What is RSS?</h2>
      <p>RSS is a free, open way to follow websites. A news reader app checks the feed for you and shows new headlines as they arrive — no account with us, no algorithm, no email needed.</p>
      <p>Prefer Facebook? <a href={site.facebookUrl} target="_blank" rel="noopener" style={{ textDecoration: 'underline' }}>Follow Globriefly on Facebook</a>.</p>
    </StaticPage>
  );
}

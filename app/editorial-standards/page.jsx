import StaticPage from '@/components/StaticPage';

export const metadata = { title: 'Editorial standards', alternates: { canonical: '/editorial-standards/' } };

export default function Standards() {
  return (
    <StaticPage title="Editorial standards">
      <p>Globriefly aims to be accurate, fair and clear. These are the rules our desk follows.</p>
      <h2>Accuracy</h2>
      <p>We only report facts that are confirmed by credible news organisations, official statements or primary documents. We do not publish rumours, and we never invent quotes, names or figures.</p>
      <h2>Attribution</h2>
      <p>Each article credits and links to the outlets whose reporting it draws on. Our headlines and articles are written in our own words.</p>
      <h2>Images</h2>
      <p>We use photographs that are licensed for reuse — from Wikimedia Commons, Unsplash, Pexels and official public-domain sources — and credit the photographer and licence under every image.</p>
      <h2>Independence</h2>
      <p>Advertising never influences what we cover or how we cover it.</p>
      <h2>Corrections</h2>
      <p>If you spot an error, <a href="/contact/?reason=correction" style={{ textDecoration: 'underline' }}>tell us through our contact form</a>. We review every request and update the article with a note explaining what changed.</p>
    </StaticPage>
  );
}

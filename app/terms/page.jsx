import StaticPage from '@/components/StaticPage';

export const metadata = { title: 'Terms of use', description: 'The terms that apply when you use Globriefly.', alternates: { canonical: '/terms/' } };

export default function Terms() {
  return (
    <StaticPage title="Terms of use">
      <p>By using Globriefly you agree to these terms. Please read them carefully.</p>
      <h2>Using our content</h2>
      <p>Articles, headlines and photocards published by Globriefly are protected by copyright. You may share links to our stories and quote short extracts with a link back to the original article. Please do not republish full articles without written permission.</p>
      <h2>Photographs</h2>
      <p>Photographs belong to their creators and are used under the licence shown beneath each image. If you reuse a photo, follow the terms of that licence.</p>
      <h2>Accuracy</h2>
      <p>We work hard to make our reporting accurate, but news changes quickly. Our content is for general information and is not professional, legal, financial or medical advice.</p>
      <h2>Links to other websites</h2>
      <p>Our articles link to other news organisations and websites. We are not responsible for their content or privacy practices.</p>
      <h2>Changes</h2>
      <p>We may update these terms from time to time. The latest version is always on this page.</p>
      <h2>Contact</h2>
      <p>Questions about these terms: <a href="/contact/" style={{ textDecoration: 'underline' }}>contact us</a>.</p>
    </StaticPage>
  );
}

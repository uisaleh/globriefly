import StaticPage from '@/components/StaticPage';

export const metadata = { title: 'Cookie policy', description: 'How Globriefly uses cookies.', alternates: { canonical: '/cookies/' } };

export default function Cookies() {
  return (
    <StaticPage title="Cookie policy">
      <p>Cookies are small text files stored on your device when you visit a website. This page explains how Globriefly uses them.</p>
      <h2>Essential cookies</h2>
      <p>Globriefly itself does not need cookies to work. You can read every story without signing in.</p>
      <h2>Analytics</h2>
      <p>We may use analytics tools to understand which stories are read most, so we can improve our coverage. These tools may set cookies that record anonymous usage information.</p>
      <h2>Advertising</h2>
      <p>If we show ads, our advertising partners, such as Google AdSense, may use cookies to show ads that are relevant to you and to measure how they perform. You can learn more and opt out of personalised ads at <a href="https://adssettings.google.com" rel="noopener">Google Ad Settings</a>.</p>
      <h2>Managing cookies</h2>
      <p>You can block or delete cookies in your browser settings at any time. Blocking cookies will not stop you reading Globriefly.</p>
      <h2>Contact</h2>
      <p>Questions: <a href="/contact/?reason=privacy" style={{ textDecoration: 'underline' }}>contact us</a>.</p>
    </StaticPage>
  );
}

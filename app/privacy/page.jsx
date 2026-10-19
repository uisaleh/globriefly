import StaticPage from '@/components/StaticPage';

export const metadata = { title: 'Privacy policy', alternates: { canonical: '/privacy/' } };

export default function Privacy() {
  return (
    <StaticPage title="Privacy policy">
      <p>This policy explains what information Globriefly collects and how we use it.</p>
      <h2>What we collect</h2>
      <p>If you subscribe to our newsletter we store your email address with our email provider, only to send you the newsletter. You can unsubscribe at any time using the link in every email.</p>
      <h2>Analytics and advertising</h2>
      <p>We may use privacy-friendly analytics and advertising partners such as Google AdSense, which can use cookies to show relevant ads. You can manage cookie preferences in your browser.</p>
      <h2>Contact</h2>
      <p>Questions about your data: <a href="/contact/?reason=privacy" style={{ textDecoration: 'underline' }}>contact us</a>. Messages sent through our contact form are delivered to our editorial inbox and used only to reply to you.</p>
    </StaticPage>
  );
}

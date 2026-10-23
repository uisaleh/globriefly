import StaticPage from '@/components/StaticPage';

export const metadata = { title: 'Privacy policy', alternates: { canonical: '/privacy/' } };

export default function Privacy() {
  return (
    <StaticPage title="Privacy policy">
      <p>This policy explains what information Globriefly collects and how we use it.</p>
      <h2>What we collect</h2>
      <p>If you subscribe to our newsletter we store your email address with our email provider, only to send you the newsletter. You can unsubscribe at any time using the link in every email.</p>
      <h2>Listening to stories</h2>
      <p>To use “Listen to this story”, you sign in once with Google (or your email). We receive only your name and email address. We use them to send you the Globriefly morning brief and occasional news about Globriefly — you can unsubscribe at any time from any email, or ask us to delete your details through our contact page. Your sign-in is remembered in your browser’s local storage on that device so you are not asked again; clearing your browser data removes it. We never sell your email address.</p>
      <h2>Analytics and advertising</h2>
      <p>We use Vercel Web Analytics to count page views and see which stories are read most. It does not use cookies and does not identify you personally. We may also use advertising partners such as Google AdSense, which can use cookies to show relevant ads. You can manage cookie preferences in your browser.</p>
      <h2>Contact</h2>
      <p>Questions about your data: <a href="/contact/?reason=privacy" style={{ textDecoration: 'underline' }}>contact us</a>. Messages sent through our contact form are delivered to our editorial inbox and used only to reply to you.</p>
    </StaticPage>
  );
}

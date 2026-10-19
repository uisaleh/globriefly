import StaticPage from '@/components/StaticPage';

export const metadata = { title: 'About', alternates: { canonical: '/about/' } };

export default function About() {
  return (
    <StaticPage title="About Globriefly">
      <p>Globriefly brings you the stories shaping the world, written clearly and published fast. We cover world news, politics, business, technology, science, health, sports and entertainment, around the clock.</p>
      <h2>What we do</h2>
      <p>Our desk follows dozens of trusted news organisations, wire services and official sources. For each story we bring the key facts together, add the background you need, and explain why it matters — in plain, neutral language.</p>
      <h2>Our promise</h2>
      <p>Every article links to the original reporting it draws on, so you can always go deeper. If we get something wrong, we fix it and say so on our corrections page.</p>
      <h2>Contact</h2>
      <p>Story tips, corrections and partnership enquiries: <a href="/contact/" style={{ textDecoration: 'underline' }}>send us a message</a>.</p>
    </StaticPage>
  );
}

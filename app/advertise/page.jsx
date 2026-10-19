import StaticPage from '@/components/StaticPage';

export const metadata = { title: 'Advertise with Globriefly', description: 'Reach a global audience of engaged news readers with Globriefly.', alternates: { canonical: '/advertise/' } };

export default function Advertise() {
  return (
    <StaticPage title="Advertise with Globriefly">
      <p>Globriefly reaches readers around the world who want clear, fast coverage of the stories that matter, on the web, in their inbox and on Facebook.</p>
      <h2>Ways to work with us</h2>
      <ul>
        <li>Display advertising on our homepage, category pages and articles</li>
        <li>Sponsorship of The Morning Brief newsletter</li>
        <li>Sponsored category sections, clearly labelled as sponsored</li>
      </ul>
      <h2>Our standards</h2>
      <p>Advertising is always clearly labelled and never influences our news coverage.</p>
      <h2>Get in touch</h2>
      <p><a href="/contact/?reason=advertising" style={{ textDecoration: 'underline' }}>Send us a message</a> for our audience figures and rates.</p>
    </StaticPage>
  );
}

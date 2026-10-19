import { Header, Footer } from '@/components/ui';
import ContactForm from '@/components/ContactForm';

export const metadata = {
  title: 'Contact us',
  description: 'Send Globriefly a story tip, correction, advertising enquiry or general question.',
  alternates: { canonical: '/contact/' },
};

const ways = [
  ['Story tips', 'Seen something we should cover? Tell us what happened and where.'],
  ['Corrections', 'Spotted an error? Send the article link and what needs fixing.'],
  ['Advertising', 'Ask about display ads, newsletter sponsorship and partnerships.'],
];

export default function Contact() {
  return (
    <>
      <Header active="page" />
      <section className="contact-hero pattern-light">
        <div className="wrap">
          <span className="kicker" style={{ color: 'var(--red-text)' }}>Contact</span>
          <h1>Get in touch</h1>
          <p className="standfirst">Questions, story tips, corrections or partnership ideas — send us a message and our team will reply by email.</p>
        </div>
      </section>
      <main className="wrap contact-main">
        <div className="contact-card">
          <ContactForm />
        </div>
        <aside className="contact-aside" aria-label="How we can help">
          {ways.map(([t, d]) => (
            <div key={t} className="contact-way">
              <h2>{t}</h2>
              <p>{d}</p>
            </div>
          ))}
          <div className="contact-way">
            <h2>Reply time</h2>
            <p>We aim to reply within two working days.</p>
          </div>
        </aside>
      </main>
      <Footer />
    </>
  );
}

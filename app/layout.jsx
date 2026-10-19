import '@fontsource/archivo/latin-400.css';
import '@fontsource/archivo/latin-600.css';
import '@fontsource/archivo/latin-700.css';
import '@fontsource/archivo/latin-800.css';
import '@fontsource/archivo/latin-900.css';
import '@fontsource/source-serif-4/latin-400.css';
import '@fontsource/source-serif-4/latin-600.css';
import { site } from '@/site.config.mjs';
import './globals.css';

export const metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s | ${site.name}` },
  description: site.description,
  alternates: { canonical: '/', types: { 'application/rss+xml': '/rss.xml' } },
  openGraph: { type: 'website', siteName: site.name, title: site.name, description: site.description, url: site.url, images: ['/og-default.png'] },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/favicon.svg', apple: '/logo.png' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
};

export const viewport = { themeColor: '#0E1116', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  const org = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: site.name,
    url: site.url,
    logo: `${site.url}/logo.png`,
    sameAs: [site.facebookUrl],
  };
  const website = { '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, url: site.url, description: site.description, inLanguage: 'en' };
  return (
    <html lang="en">
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([org, website]) }} />
      </body>
    </html>
  );
}

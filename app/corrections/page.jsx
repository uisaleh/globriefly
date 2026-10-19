import StaticPage from '@/components/StaticPage';

export const metadata = { title: 'Corrections', alternates: { canonical: '/corrections/' } };

export default function Corrections() {
  return (
    <StaticPage title="Corrections">
      <p>We work hard to get every story right. When we make a mistake, we correct it promptly and add a note to the article.</p>
      <p>To report an error, <a href="/contact/?reason=correction" style={{ textDecoration: 'underline' }}>use our contact form</a> and include the article link and what needs fixing.</p>
    </StaticPage>
  );
}

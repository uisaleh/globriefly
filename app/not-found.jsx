import Link from 'next/link';
import StaticPage from '@/components/StaticPage';

export default function NotFound() {
  return (
    <StaticPage title="Page not found">
      <p>This page may have moved or no longer exists.</p>
      <p><Link href="/" style={{ textDecoration: 'underline' }}>Go to today’s top stories</Link></p>
    </StaticPage>
  );
}

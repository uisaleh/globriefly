import { getAllPosts, pageCount, pageOf } from '@/lib/posts';
import Listing from '@/components/Listing';

export const metadata = {
  title: 'All stories',
  description: 'Every Globriefly story, newest first.',
  alternates: { canonical: '/archive/' },
};

export default function Archive() {
  const all = getAllPosts();
  return <Listing title="All stories" kicker="Archive" intro="Every story we have published, newest first." posts={pageOf(all, 1)} page={1} pages={pageCount(all)} basePath="/archive/" />;
}

import { getAllPosts, pageCount, pageOf } from '@/lib/posts';
import Listing from '@/components/Listing';

export const dynamicParams = false;

export function generateStaticParams() {
  const pages = pageCount(getAllPosts());
  const params = Array.from({ length: pages - 1 }, (_, i) => ({ n: String(i + 2) }));
  return params.length ? params : [{ n: '2' }];
}

export async function generateMetadata({ params }) {
  const { n } = await params;
  const empty = getAllPosts().length <= (Number(n) - 1) * 30;
  return { title: `All stories — page ${n}`, alternates: { canonical: `/archive/page/${n}/` }, robots: empty ? { index: false, follow: true } : undefined };
}

export default async function ArchivePage({ params }) {
  const { n } = await params;
  const all = getAllPosts();
  const page = Number(n);
  return <Listing title="All stories" kicker="Archive" posts={pageOf(all, page)} page={page} pages={pageCount(all)} basePath="/archive/" />;
}

import { Header, Footer } from '@/components/ui';

export default function StaticPage({ title, children }) {
  return (
    <>
      <Header active="page" />
      <main className="wrap prose">
        <h1>{title}</h1>
        {children}
      </main>
      <Footer />
    </>
  );
}

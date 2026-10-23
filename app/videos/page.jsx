import { Header, Footer } from '@/components/ui';
import VideoCard from '@/components/VideoCard';
import { getVideos } from '@/lib/videos';

export const metadata = {
  title: 'Watch: latest world news videos',
  description: 'The latest news videos from around the world, updated through the day.',
  alternates: { canonical: '/videos/' },
};

export default function VideosPage() {
  const videos = getVideos(24);
  return (
    <>
      <Header active="page" />
      <main>
        <section className="band-dark pattern-dark" style={{ minHeight: '60vh' }}>
          <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div className="sec-head"><h1 style={{ fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.025em' }}>Watch</h1></div>
            <p style={{ color: 'var(--on-dark)', fontSize: 17, marginTop: -12 }}>The latest news videos from leading broadcasters, updated through the day.</p>
            {videos.length === 0 && <p style={{ color: 'var(--on-dark)' }}>New videos will appear here shortly.</p>}
            <div className="video-grid">{videos.map((v) => <VideoCard key={v.id} video={v} />)}</div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

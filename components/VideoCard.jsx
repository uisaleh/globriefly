'use client';
import { useState } from 'react';
import TimeAgo from './TimeAgo';

// Shows the YouTube thumbnail with a play button; the official YouTube player only loads on click.
export default function VideoCard({ video, dark = true }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className={`video-card${dark ? ' on-dark' : ''}`}>
      <div className="video-frame">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} aria-label={`Play video: ${video.title}`}>
            <img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt="" className="thumb r169" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
            <span className="video-play" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" fill="#FFFFFF" /></svg></span>
            <span className="video-src">{video.channel}</span>
          </button>
        )}
      </div>
      <span className="video-title">{video.title}</span>
      <span className="video-meta">Video: <a href={video.channelUrl} target="_blank" rel="noopener">{video.channel}</a> · <TimeAgo iso={video.publishedAt} /></span>
    </div>
  );
}

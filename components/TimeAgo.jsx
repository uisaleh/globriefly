'use client';
import { useEffect, useState } from 'react';

function format(iso) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso)) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function Today() {
  const [text, setText] = useState('');
  useEffect(() => {
    setText(new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  }, []);
  return <span suppressHydrationWarning>{text || ' '}</span>;
}

// Shows the date at build time, then a live "x min ago" in the reader's browser.
export default function TimeAgo({ iso }) {
  const [text, setText] = useState(() => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }));
  useEffect(() => {
    setText(format(iso));
    const t = setInterval(() => setText(format(iso)), 60000);
    return () => clearInterval(t);
  }, [iso]);
  return <time dateTime={iso} suppressHydrationWarning>{text}</time>;
}

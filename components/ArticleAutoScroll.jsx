'use client';
import { useEffect } from 'react';

// On story pages, start the view at the story itself (headline → photo) instead of the site header.
// Readers can still scroll up to the header and menu. Skipped when the page was opened at an anchor,
// restored to a scroll position, or the reader has already scrolled.
export default function ArticleAutoScroll() {
  useEffect(() => {
    if (window.location.hash || window.scrollY > 10) return;
    const nav = performance.getEntriesByType?.('navigation')?.[0];
    if (nav && nav.type === 'back_forward') return;
    const target = document.querySelector('.article .crumbs') || document.querySelector('.article');
    if (!target) return;
    const go = () => {
      if (window.scrollY > 10) return;
      const top = target.getBoundingClientRect().top + window.scrollY - 12;
      if (top > 40) window.scrollTo({ top, behavior: 'instant' });
      // Fit the lead photo on screen too, if a modest crop is enough (keeps ≥ 62 % of its height).
      const img = document.querySelector('.article figure img');
      if (img) {
        const r = img.getBoundingClientRect();
        const room = window.innerHeight - r.top - 16;
        if (r.bottom > window.innerHeight && room >= r.height * 0.62) {
          img.style.height = `${Math.round(room)}px`;
          img.style.aspectRatio = 'auto';
          img.style.objectFit = 'cover';
        }
      }
    };
    requestAnimationFrame(go);
  }, []);
  return null;
}

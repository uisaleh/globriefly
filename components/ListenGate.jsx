'use client';
import { useEffect, useRef, useState } from 'react';
import { site } from '@/site.config.mjs';

// Sign-in to unlock "Listen". No account pages: Google gives us the reader's name + email, we keep it on
// this device (so they are never asked again here) and send it to the desk inbox / sheet for the newsletter.
// If no Google Client ID is configured yet, an email field is shown instead.

const KEY = 'gb-listener';
export function getListener() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}
function saveListener(l) {
  try { localStorage.setItem(KEY, JSON.stringify(l)); } catch {}
}

function decodeJwt(token) {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(part + '='.repeat((4 - (part.length % 4)) % 4)))));
  } catch { return null; }
}

async function sendLead(l) {
  const payload = { email: l.email, name: l.name || '', method: l.method, page: window.location.href, at: new Date().toISOString() };
  try {
    if (site.leadsEndpoint) {
      await fetch(site.leadsEndpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload) });
      return;
    }
    await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: site.contactFormKey,
        subject: 'New listener sign-up (Listen feature)',
        from_name: 'Globriefly listener',
        email: l.email,
        name: l.name || '',
        message: `New listener: ${l.name ? l.name + ' — ' : ''}${l.email}\nSigned in with: ${l.method}\nStory: ${payload.page}\nAgreed to receive the Globriefly newsletter.`,
      }),
    });
  } catch {}
}

let gisLoading = null;
function loadGis() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gisLoading) {
    gisLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return gisLoading;
}

export default function ListenGate({ onDone, onClose }) {
  const btnRef = useRef(null);
  const dialogRef = useRef(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [googleReady, setGoogleReady] = useState(false);
  const useGoogle = Boolean(site.googleClientId);

  function finish(l) {
    const listener = { ...l, at: new Date().toISOString() };
    saveListener(listener);
    sendLead(listener);
    onDone(listener);
  }

  useEffect(() => {
    const prev = document.activeElement;
    dialogRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus?.(); };
  }, []);

  useEffect(() => {
    if (!useGoogle) return;
    let cancelled = false;
    loadGis().then(() => {
      if (cancelled || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: site.googleClientId,
        callback: (res) => {
          const p = decodeJwt(res.credential);
          if (!p?.email) { setError('Google sign-in did not return an email. Please try again.'); return; }
          finish({ email: p.email, name: p.name || '', picture: p.picture || '', method: 'Google' });
        },
        ux_mode: 'popup',
        auto_select: false,
        itp_support: true,
      });
      window.google.accounts.id.renderButton(btnRef.current, { theme: 'filled_blue', size: 'large', shape: 'pill', text: 'continue_with', logo_alignment: 'left', width: 280 });
      setGoogleReady(true);
    }).catch(() => setError('Google sign-in could not load. Check your connection, or use your email below.'));
    return () => { cancelled = true; };
  }, []);

  function submitEmail(e) {
    e.preventDefault();
    const v = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { setError('Please enter a valid email address.'); return; }
    finish({ email: v, name: '', method: 'Email' });
  }

  return (
    <div className="gate-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title" tabIndex={-1} ref={dialogRef}>
        <button type="button" className="gate-close" onClick={onClose} aria-label="Close"><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg></button>
        <div className="gate-head pattern-color">
          <span className="gate-icon" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14v-2a9 9 0 0 1 18 0v2" /><rect x="3" y="14" width="4" height="7" rx="1.5" /><rect x="17" y="14" width="4" height="7" rx="1.5" /></svg></span>
          <h2 id="gate-title">Listen to every story, free</h2>
          <p>Sign in once on this device and press play on any article — no password, no account to manage.</p>
        </div>
        <div className="gate-body">
          {useGoogle && (
            <div className="gate-google">
              <div ref={btnRef} className="gate-gbtn" />
              {!googleReady && !error && <span className="gate-loading">Loading Google sign-in…</span>}
            </div>
          )}
          {(!useGoogle || error) && (
          <form onSubmit={submitEmail} className="gate-form" noValidate>
            <label htmlFor="gate-email" className="sr-only">Email address</label>
            <input id="gate-email" type="email" autoComplete="email" placeholder="you@gmail.com" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} />
            <button type="submit">Continue &amp; listen</button>
          </form>
          )}
          {error && <p className="gate-error" role="alert">{error}</p>}
          <p className="gate-legal">
            By continuing you agree to receive the Globriefly morning brief by email. Unsubscribe any time.
            We keep your email on this device so you won’t be asked again. <a href="/privacy/" target="_blank" rel="noopener">Privacy policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}

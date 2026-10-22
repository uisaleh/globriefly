'use client';
import { useState } from 'react';
import { site } from '@/site.config.mjs';

// Sends each sign-up to the desk inbox via Web3Forms (same service as the contact form).
// If a newsletter provider is set up later, NEXT_PUBLIC_NEWSLETTER_ACTION takes over.
export default function NewsletterForm() {
  const [state, setState] = useState('idle'); // idle | sending | done | error
  const [email, setEmail] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    if (state === 'sending') return;
    const form = e.currentTarget;
    if (form.botcheck?.checked) return;
    setState('sending');
    try {
      if (site.newsletterAction) {
        await fetch(site.newsletterAction, { method: 'POST', mode: 'no-cors', body: new FormData(form) });
      } else {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: site.contactFormKey,
            subject: 'New morning brief subscriber',
            from_name: 'Globriefly newsletter',
            email,
            message: `New subscriber: ${email}`,
            page: typeof window !== 'undefined' ? window.location.href : '',
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) throw new Error(data.message || 'failed');
      }
      setState('done');
      setEmail('');
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return <p className="nl-msg" role="status" style={{ fontSize: 20, flex: '1 1 340px' }}>Thanks — you’re on the list for the morning brief.</p>;
  }
  return (
    <form onSubmit={onSubmit} noValidate={false}>
      <label htmlFor="nl-email" className="sr-only">Email address</label>
      <input id="nl-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="checkbox" name="botcheck" tabIndex={-1} aria-hidden="true" style={{ display: 'none' }} />
      <button type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Subscribing…' : 'Subscribe free'}</button>
      {state === 'error' && <p className="nl-msg" role="alert">Something went wrong. Please try again in a moment.</p>}
    </form>
  );
}

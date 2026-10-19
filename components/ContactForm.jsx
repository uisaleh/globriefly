'use client';
import { useEffect, useState } from 'react';
import { site } from '@/site.config.mjs';

export const REASONS = [
  { value: 'general', label: 'General enquiry' },
  { value: 'tip', label: 'Story tip' },
  { value: 'correction', label: 'Report a correction' },
  { value: 'advertising', label: 'Advertising & partnerships' },
  { value: 'privacy', label: 'Privacy & data' },
  { value: 'technical', label: 'Website problem' },
  { value: 'other', label: 'Something else' },
];

const empty = { name: '', email: '', phone: '', reason: 'general', message: '' };

export default function ContactForm() {
  const [form, setForm] = useState(empty);
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  // Pre-select the reason from links like /contact/?reason=correction
  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get('reason');
    if (r && REASONS.some((x) => x.value === r)) setForm((f) => ({ ...f, reason: r }));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (e.target.botcheck?.checked) return; // spam bot
    if (!site.contactFormKey) {
      setStatus('error');
      setError('Our contact form is being set up. Please try again soon.');
      return;
    }
    setStatus('sending');
    setError('');
    const reasonLabel = REASONS.find((r) => r.value === form.reason)?.label || form.reason;
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: site.contactFormKey,
          subject: `${site.name} contact: ${reasonLabel} — ${form.name}`,
          from_name: `${site.name} website`,
          name: form.name,
          email: form.email,
          phone: form.phone || 'Not given',
          reason: reasonLabel,
          message: form.message,
          page: typeof window !== 'undefined' ? window.location.href : '',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.message || 'Something went wrong.');
      setStatus('sent');
      setForm(empty);
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Something went wrong. Please try again.');
    }
  }

  if (status === 'sent') {
    return (
      <div className="form-done" role="status">
        <span className="form-done-icon" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </span>
        <h2>Thanks — your message has been sent.</h2>
        <p>We read every message and will reply to you by email, usually within two working days.</p>
        <button type="button" className="btn btn-dark" onClick={() => setStatus('idle')}>Send another message</button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={submit} noValidate={false}>
      <div className="field-row">
        <div className="field">
          <label htmlFor="cf-name">Full name <span aria-hidden="true">*</span></label>
          <input id="cf-name" name="name" required autoComplete="name" value={form.name} onChange={set('name')} placeholder="Your name" />
        </div>
        <div className="field">
          <label htmlFor="cf-email">Email <span aria-hidden="true">*</span></label>
          <input id="cf-email" name="email" type="email" required autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="cf-phone">Phone <span className="opt">(optional)</span></label>
          <input id="cf-phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="+880 1XXX-XXXXXX" />
        </div>
        <div className="field">
          <label htmlFor="cf-reason">Reason <span aria-hidden="true">*</span></label>
          <select id="cf-reason" name="reason" required value={form.reason} onChange={set('reason')}>
            {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="cf-message">Message <span aria-hidden="true">*</span></label>
        <textarea id="cf-message" name="message" required minLength={10} rows={7} value={form.message} onChange={set('message')} placeholder={form.reason === 'correction' ? 'Paste the article link and tell us what needs fixing.' : 'How can we help?'} />
      </div>
      <input type="checkbox" name="botcheck" className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {status === 'error' && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        <button type="submit" className="btn" disabled={status === 'sending'} style={{ height: 52, padding: '0 28px', fontSize: 16 }}>
          {status === 'sending' ? 'Sending…' : 'Send message'}
        </button>
        <span className="meta">Fields marked * are required. We only use your details to reply to you.</span>
      </div>
    </form>
  );
}

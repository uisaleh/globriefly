'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

// "Listen to this story" — reads the article aloud with the US/UK English voices built into the reader's device
// (Web Speech API: free, no server). It reads every element tagged data-tts in page order, highlights the
// sentence being read, follows it down the page, and keeps a compact player on screen with a seekable timeline.

const FEMALE = /female|woman|samantha|karen|moira|tessa|victoria|fiona|serena|allison|ava|susan|zoe|kate|catherine|nicky|joelle|flo\b|sandy|shelley|grandma|martha|zira|aria|jenny|sonia|libby|natasha|clara|emma|michelle|hazel|amy|salli|joanna|kimberly|ivy|kendra|olivia|isla|maisie|jane|linda|heather|leah|ashley|elizabeth|sara|nancy|monica|ana\b/i;
const MALE = /\bmale\b|\bman\b|daniel|alex\b|fred|\btom\b|oliver|arthur|aaron|gordon|\blee\b|reed|rocko|eddy|grandpa|ralph|david|mark|guy|ryan|george|james|william|thomas|christopher|eric|brian|matthew|justin|joey|russell|liam|noah|andrew|brandon|davis|jason|tony|roger|steffan/i;
const QUALITY = /natural|neural|premium|enhanced|online|google|siri/i;
const ACCENT = { US: 'US English', GB: 'UK English' };
const WPS = 2.6; // words per second at 1× — used to estimate the timeline

function genderOf(v) {
  const n = v.name;
  if (/\bfemale\b/i.test(n)) return 'female';
  if (/\bmale\b/i.test(n)) return 'male';
  if (FEMALE.test(n)) return 'female';
  if (MALE.test(n)) return 'male';
  return 'other';
}
function label(v) {
  if (!v) return 'Device voice';
  const region = (v.lang || '').split(/[-_]/)[1]?.toUpperCase();
  const name = /^Google\s+(UK|US)\s+English/i.test(v.name) ? 'Google' : v.name.replace(/^(Microsoft|Google)\s+/i, '').replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+Online.*$/i, '').replace(/\s*-\s*English.*$/i, '').trim();
  const g = genderOf(v);
  return `${name}${ACCENT[region] ? ` · ${ACCENT[region]}` : ''}${g !== 'other' ? ` · ${g === 'female' ? 'Woman' : 'Man'}` : ''}`;
}
const fmt = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

// Build reading chunks (≈ one sentence each) with their character offsets inside each element,
// so the exact sentence can be highlighted.
function buildChunks() {
  const out = [];
  document.querySelectorAll('.article [data-tts]').forEach((el) => {
    const say = el.getAttribute('data-tts-say');
    if (say) { out.push({ el, text: say, start: -1, end: -1 }); return; }
    const text = el.textContent || '';
    const re = /[^.!?]+(?:[.!?]+["'’”)\]]*|$)/g;
    let m;
    while ((m = re.exec(text))) {
      let s = m.index, e = m.index + m[0].length;
      while (s < e && /\s/.test(text[s])) s++;
      while (e > s && /\s/.test(text[e - 1])) e--;
      if (e - s < 2) continue;
      // Very long sentences are split at a comma so no single utterance runs too long.
      while (e - s > 260) {
        const cut = text.lastIndexOf(', ', s + 220);
        if (cut <= s + 60) break;
        out.push({ el, text: text.slice(s, cut + 1), start: s, end: cut + 1 });
        s = cut + 2;
      }
      out.push({ el, text: text.slice(s, e), start: s, end: e });
    }
  });
  return out.map((c) => ({ ...c, secs: c.text.split(/\s+/).filter(Boolean).length / WPS + 0.35 }));
}

// DOM Range covering characters [start, end) of an element's text.
function rangeFor(el, start, end) {
  const r = document.createRange();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let pos = 0, node, startSet = false;
  while ((node = walker.nextNode())) {
    const len = node.nodeValue.length;
    if (!startSet && start <= pos + len) { r.setStart(node, Math.max(0, start - pos)); startSet = true; }
    if (startSet && end <= pos + len) { r.setEnd(node, Math.max(0, end - pos)); return r; }
    pos += len;
  }
  return null;
}

export default function ListenPlayer() {
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const [voiceName, setVoiceName] = useState('');
  const [rate, setRate] = useState(1);
  const [state, setState] = useState('idle'); // idle | playing | paused
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0); // seconds into the whole story (at current speed)
  const [open, setOpen] = useState(false);
  const [follow, setFollow] = useState(true);
  const [inlineVisible, setInlineVisible] = useState(true);
  const [chunks, setChunks] = useState([]);
  const run = useRef({ i: 0, token: 0, chunkStart: 0, follow: true, programmaticUntil: 0 });
  const cardRef = useRef(null);

  const durations = chunks.map((c) => c.secs / rate);
  const starts = durations.reduce((a, d, i) => (a.push(i ? a[i - 1] + durations[i - 1] : 0), a), []);
  const total = durations.reduce((a, b) => a + b, 0);

  // Voices (US + UK English only) and saved preferences
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    setSupported(true);
    setChunks(buildChunks());
    const load = () => {
      const usuk = window.speechSynthesis.getVoices().filter((v) => /^en[-_](US|GB)/i.test(v.lang));
      const gendered = usuk.filter((v) => genderOf(v) !== 'other');
      const all = gendered.length ? gendered : usuk;
      all.sort((a, b) => (QUALITY.test(b.name) - QUALITY.test(a.name)) || (/^en[-_]US/i.test(b.lang) - /^en[-_]US/i.test(a.lang)) || a.name.localeCompare(b.name));
      setVoices(all);
      const saved = store.get('gb-voice');
      setVoiceName((cur) => cur || (all.find((v) => v.name === saved) || all.find((v) => genderOf(v) === 'female') || all[0])?.name || '');
    };
    load();
    window.speechSynthesis.addEventListener?.('voiceschanged', load);
    const r = Number(store.get('gb-rate'));
    if (r) setRate(r);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', load);
      window.speechSynthesis.cancel();
      clearHighlight();
    };
  }, []);

  // Is the inline card on screen? If not, the floating player shows.
  useEffect(() => {
    if (!cardRef.current || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setInlineVisible(e.isIntersecting), { threshold: 0.2 });
    io.observe(cardRef.current);
    return () => io.disconnect();
  }, [supported]);

  // If the reader scrolls by hand, stop following until they tap "Back to reading".
  useEffect(() => {
    if (state === 'idle') return;
    const stopFollow = () => { if (Date.now() > run.current.programmaticUntil) { run.current.follow = false; setFollow(false); } };
    window.addEventListener('wheel', stopFollow, { passive: true });
    window.addEventListener('touchmove', stopFollow, { passive: true });
    return () => { window.removeEventListener('wheel', stopFollow); window.removeEventListener('touchmove', stopFollow); };
  }, [state]);

  // Smooth timeline while speaking
  useEffect(() => {
    if (state !== 'playing') return;
    const t = setInterval(() => {
      const i = run.current.i;
      const into = Math.min((durations[i] || 0) * 0.97, (performance.now() - run.current.chunkStart) / 1000);
      setElapsed((starts[i] || 0) + into);
    }, 250);
    return () => clearInterval(t);
  }, [state, rate, chunks]);

  // Click a paragraph while listening → read from there
  useEffect(() => {
    if (state === 'idle') return;
    const onClick = (e) => {
      if (e.target.closest('a, button, input, select, label')) return;
      const el = e.target.closest('.article [data-tts]');
      if (!el) return;
      const k = chunks.findIndex((c) => c.el === el);
      if (k >= 0) { run.current.follow = true; setFollow(true); speakFrom(k); }
    };
    document.addEventListener('click', onClick);
    document.body.classList.add('tts-on');
    return () => { document.removeEventListener('click', onClick); document.body.classList.remove('tts-on'); };
  }, [state, chunks, voiceName, rate]);

  const voice = voices.find((v) => v.name === voiceName);
  const females = voices.filter((v) => genderOf(v) === 'female');
  const males = voices.filter((v) => genderOf(v) === 'male');
  const gender = voice ? genderOf(voice) : 'other';

  function clearHighlight() {
    try { CSS?.highlights?.delete('tts'); } catch {}
    document.querySelectorAll('.tts-current').forEach((n) => n.classList.remove('tts-current'));
  }

  const show = useCallback((k, scroll = true) => {
    const c = chunks[k];
    if (!c) return;
    clearHighlight();
    c.el.classList.add('tts-current');
    let rect = c.el.getBoundingClientRect();
    if (c.start >= 0) {
      const r = rangeFor(c.el, c.start, c.end);
      if (r) {
        try { if (window.Highlight && CSS.highlights) CSS.highlights.set('tts', new window.Highlight(r)); } catch {}
        const rr = r.getBoundingClientRect();
        if (rr.height) rect = rr;
      }
    }
    if (scroll && run.current.follow) {
      const top = 90, bottom = window.innerHeight - 150; // keep clear of the header and the floating player
      if (rect.top < top || rect.bottom > bottom) {
        run.current.programmaticUntil = Date.now() + 900;
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: window.scrollY + rect.top - window.innerHeight * 0.35, behavior: reduce ? 'auto' : 'smooth' });
      }
    }
  }, [chunks]);

  function speakFrom(i, opts = {}) {
    const synth = window.speechSynthesis;
    synth.cancel();
    const token = ++run.current.token;
    const v = opts.voice !== undefined ? opts.voice : voice;
    const r = opts.rate || rate;
    const next = (k) => {
      if (token !== run.current.token) return;
      if (k >= chunks.length) { stop(); return; }
      run.current.i = k;
      setIndex(k);
      setElapsed(starts[k] || 0);
      show(k);
      const u = new SpeechSynthesisUtterance(chunks[k].text);
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-GB';
      u.rate = r;
      u.onstart = () => { run.current.chunkStart = performance.now(); };
      u.onend = () => next(k + 1);
      u.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled') next(k + 1); };
      run.current.chunkStart = performance.now();
      synth.speak(u);
    };
    setState('playing');
    next(i);
  }

  function toggle() {
    if (state === 'playing') { run.current.token++; window.speechSynthesis.cancel(); setState('paused'); return; }
    if (state === 'idle') { run.current.follow = true; setFollow(true); }
    speakFrom(state === 'paused' ? run.current.i : 0);
  }
  function stop() {
    run.current.token++;
    window.speechSynthesis.cancel();
    clearHighlight();
    setState('idle'); setIndex(0); setElapsed(0); run.current.i = 0;
  }
  function skip(d) {
    const k = Math.max(0, Math.min(chunks.length - 1, run.current.i + d));
    run.current.i = k; setIndex(k); setElapsed(starts[k] || 0);
    if (state === 'playing') speakFrom(k); else show(k);
  }
  function seek(seconds) {
    let k = 0;
    while (k < starts.length - 1 && starts[k + 1] <= seconds) k++;
    run.current.i = k; setIndex(k); setElapsed(starts[k] || 0);
    run.current.follow = true; setFollow(true);
    if (state === 'playing') speakFrom(k); else show(k);
  }
  function backToReading() { run.current.follow = true; setFollow(true); show(run.current.i); }
  function pickVoice(name) {
    setVoiceName(name); store.set('gb-voice', name);
    const v = voices.find((x) => x.name === name);
    if (state === 'playing') speakFrom(run.current.i, { voice: v });
  }
  function pickGender(g) { const list = g === 'female' ? females : males; if (list[0]) pickVoice(list[0].name); }
  function pickRate(r) {
    setRate(r); store.set('gb-rate', String(r));
    if (state === 'playing') speakFrom(run.current.i, { rate: r });
  }
  const nextRate = () => { const list = [0.8, 1, 1.25, 1.5, 2]; pickRate(list[(list.indexOf(rate) + 1) % list.length]); };

  if (!supported || !chunks.length) return null;
  const active = state !== 'idle';
  const playIcon = state === 'playing'
    ? <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1" fill="#fff" /><rect x="14" y="4" width="4" height="16" rx="1" fill="#fff" /></svg>
    : <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ marginLeft: 2 }}><path d="M7 4l13 8-13 8z" fill="#fff" /></svg>;
  const playLabel = state === 'playing' ? 'Pause' : state === 'paused' ? 'Resume' : 'Listen to this story';
  const prevIcon = <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="2.6" height="14" rx="1" fill="currentColor" /><path d="M19 5.5v13a.8.8 0 0 1-1.2.7L9 12.7a.8.8 0 0 1 0-1.4l8.8-6.5a.8.8 0 0 1 1.2.7z" fill="currentColor" /></svg>;
  const nextIcon = <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><rect x="16.4" y="5" width="2.6" height="14" rx="1" fill="currentColor" /><path d="M5 5.5v13a.8.8 0 0 0 1.2.7l8.8-6.5a.8.8 0 0 0 0-1.4L6.2 4.8A.8.8 0 0 0 5 5.5z" fill="currentColor" /></svg>;
  const timeline = (cls) => (
    <div className={`listen-timeline ${cls || ''}`}>
      <span className="listen-time">{fmt(elapsed)}</span>
      <input
        type="range" min="0" max={Math.max(1, Math.round(total))} step="1" value={Math.round(elapsed)}
        onChange={(e) => seek(Number(e.target.value))}
        aria-label="Timeline" aria-valuetext={`${fmt(elapsed)} of ${fmt(total)}`}
        style={{ '--pct': `${total ? (elapsed / total) * 100 : 0}%` }}
      />
      <span className="listen-time">{fmt(total)}</span>
    </div>
  );

  return (
    <>
      <section ref={cardRef} className={`listen${active ? ' is-active' : ''}`} aria-label="Listen to this story">
        <div className="listen-main">
          <button type="button" className="listen-play" onClick={toggle} aria-label={playLabel}>{playIcon}</button>
          <div className="listen-info">
            <span className="listen-title">{state === 'playing' ? 'Listening…' : state === 'paused' ? 'Paused' : 'Listen to this story'}</span>
            <span className="listen-sub">{active ? `${label(voice)} · ${rate}×` : `${fmt(total)} · ${label(voice)}`}</span>
          </div>
          {active && (
            <div className="listen-ctrl">
              <button type="button" onClick={() => skip(-1)} aria-label="Previous sentence" title="Previous sentence">{prevIcon}</button>
              <button type="button" onClick={() => skip(1)} aria-label="Next sentence" title="Next sentence">{nextIcon}</button>
              <button type="button" onClick={stop} aria-label="Stop" title="Stop"><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" /></svg></button>
            </div>
          )}
          <button type="button" className="listen-settings" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Voice settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>
            <span>Voice</span>
          </button>
        </div>
        {active && timeline()}
        {open && (
          <div className="listen-opts">
            {(females.length > 0 || males.length > 0) && (
              <div className="listen-row" role="group" aria-label="Narrator">
                <span className="listen-lbl">Narrator</span>
                {females.length > 0 && <button type="button" className={gender === 'female' ? 'on' : ''} onClick={() => pickGender('female')}>Woman</button>}
                {males.length > 0 && <button type="button" className={gender === 'male' ? 'on' : ''} onClick={() => pickGender('male')}>Man</button>}
              </div>
            )}
            {voices.length > 1 && (
              <label className="listen-row">
                <span className="listen-lbl">Voice</span>
                <select value={voiceName} onChange={(e) => pickVoice(e.target.value)}>
                  {[['Women', females], ['Men', males], ['Voices', voices.filter((v) => genderOf(v) === 'other')]].map(([g, list]) => list.length > 0 && (
                    <optgroup key={g} label={g}>{list.map((v) => <option key={v.name} value={v.name}>{label(v)}</option>)}</optgroup>
                  ))}
                </select>
              </label>
            )}
            <div className="listen-row" role="group" aria-label="Speed">
              <span className="listen-lbl">Speed</span>
              {[0.8, 1, 1.25, 1.5, 2].map((r) => <button key={r} type="button" className={rate === r ? 'on' : ''} onClick={() => pickRate(r)}>{r}×</button>)}
            </div>
            <p className="listen-note">Tip: while listening, tap any paragraph to read from there. US and UK English voices come from your device.</p>
          </div>
        )}
      </section>

      {/* Floating player — stays on screen while listening */}
      {active && !inlineVisible && (
        <div className="listen-float" role="region" aria-label="Audio player">
          <div className="listen-float-in">
            <div className="listen-float-row">
              <button type="button" className="lf-btn" onClick={() => skip(-1)} aria-label="Previous sentence">{prevIcon}</button>
              <button type="button" className="listen-play lf-play" onClick={toggle} aria-label={playLabel}>{playIcon}</button>
              <button type="button" className="lf-btn" onClick={() => skip(1)} aria-label="Next sentence">{nextIcon}</button>
              <div className="lf-info">
                <span className="lf-title">{state === 'playing' ? 'Listening' : 'Paused'} · <span className="lf-voice">{label(voice)}</span></span>
                {timeline('lf-timeline')}
              </div>
              <button type="button" className="lf-btn lf-rate" onClick={nextRate} aria-label={`Speed ${rate}×, change`}>{rate}×</button>
              <button type="button" className="lf-btn" onClick={stop} aria-label="Stop and close player"><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg></button>
            </div>
            {!follow && <button type="button" className="lf-follow" onClick={backToReading}>↓ Back to reading</button>}
          </div>
        </div>
      )}
      {active && inlineVisible && !follow && (
        <button type="button" className="lf-follow lf-follow-solo" onClick={backToReading}>↓ Back to reading</button>
      )}
    </>
  );
}

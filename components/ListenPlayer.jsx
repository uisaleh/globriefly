'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

// "Listen to this story" — reads the article aloud with the voices built into the reader's own device
// (Web Speech API). Free, no server, works offline once the page has loaded.
// Voices differ by device/browser, so we list every English voice and offer quick Female / Male picks.

const FEMALE = /female|woman|samantha|karen|moira|tessa|victoria|fiona|veena|serena|allison|ava|susan|zoe|kate|catherine|nicky|joelle|flo\b|sandy|shelley|grandma|martha|zira|aria|jenny|sonia|libby|natasha|clara|emma|michelle|hazel|heera|neerja|ana\b|amy|salli|joanna|kimberly|ivy|kendra|olivia|isla|maisie|jane|linda|heather|leah|ashley|elizabeth|sara|nancy|monica|sunita|kajal/i;
const MALE = /\bmale\b|\bman\b|daniel|alex\b|fred|\btom\b|oliver|arthur|aaron|rishi|gordon|\blee\b|reed|rocko|eddy|grandpa|ralph|david|mark|guy|ryan|george|james|william|thomas|christopher|eric|prabhat|ravi|brian|matthew|justin|joey|russell|liam|noah|andrew|brandon|davis|jason|tony|roger|steffan|ken\b/i;
const QUALITY = /natural|neural|premium|enhanced|online|google|siri/i;

const ACCENT = { US: 'US English', GB: 'UK English' };

function genderOf(v) {
  const n = v.name;
  if (/\bfemale\b/i.test(n)) return 'female';
  if (/\bmale\b/i.test(n)) return 'male';
  if (FEMALE.test(n)) return 'female';
  if (MALE.test(n)) return 'male';
  return 'other';
}

function label(v) {
  const region = (v.lang || '').split(/[-_]/)[1]?.toUpperCase();
  const name = /^Google\s+(UK|US)\s+English/i.test(v.name) ? 'Google' : v.name.replace(/^(Microsoft|Google)\s+/i, '').replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+Online.*$/i, '').replace(/\s*-\s*English.*$/i, '').trim();
  const g = genderOf(v);
  return `${name}${ACCENT[region] ? ` · ${ACCENT[region]}` : ''}${g !== 'other' ? ` · ${g === 'female' ? 'Woman' : 'Man'}` : ''}`;
}

// Split into short chunks: long utterances get cut off in some browsers.
function chunk(texts) {
  const out = [];
  for (const t of texts) {
    const sentences = String(t).replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+["')\]]*|\S[^.!?]*$/g) || [];
    let buf = '';
    for (const s of sentences) {
      if ((buf + ' ' + s).length > 220 && buf) { out.push(buf.trim()); buf = s; } else buf += ' ' + s;
    }
    if (buf.trim()) out.push(buf.trim());
  }
  return out;
}

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

export default function ListenPlayer({ texts, minutes = 4 }) {
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const [voiceName, setVoiceName] = useState('');
  const [rate, setRate] = useState(1);
  const [state, setState] = useState('idle'); // idle | playing | paused
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const chunks = useMemo(() => chunk(texts), [texts]);
  const run = useRef({ i: 0, token: 0 });

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    setSupported(true);
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
    };
  }, []);

  const voice = voices.find((v) => v.name === voiceName);
  const females = voices.filter((v) => genderOf(v) === 'female');
  const males = voices.filter((v) => genderOf(v) === 'male');
  const gender = voice ? genderOf(voice) : 'other';

  function speakFrom(i, opts = {}) {
    const synth = window.speechSynthesis;
    synth.cancel();
    const token = ++run.current.token;
    const v = opts.voice || voice;
    const r = opts.rate || rate;
    const next = (k) => {
      if (token !== run.current.token) return;
      if (k >= chunks.length) { setState('idle'); setIndex(0); run.current.i = 0; return; }
      run.current.i = k;
      setIndex(k);
      const u = new SpeechSynthesisUtterance(chunks[k]);
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-GB';
      u.rate = r;
      u.onend = () => next(k + 1);
      u.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled') next(k + 1); };
      synth.speak(u);
    };
    setState('playing');
    next(i);
  }

  function toggle() {
    setOpen(true);
    if (state === 'playing') { run.current.token++; window.speechSynthesis.cancel(); setState('paused'); return; }
    speakFrom(state === 'paused' ? run.current.i : 0);
  }
  function stop() { run.current.token++; window.speechSynthesis.cancel(); setState('idle'); setIndex(0); run.current.i = 0; }
  function pickVoice(name) {
    setVoiceName(name); store.set('gb-voice', name);
    const v = voices.find((x) => x.name === name);
    if (state === 'playing') speakFrom(run.current.i, { voice: v });
  }
  function pickGender(g) {
    const list = g === 'female' ? females : males;
    if (list[0]) pickVoice(list[0].name);
  }
  function pickRate(r) {
    setRate(r); store.set('gb-rate', String(r));
    if (state === 'playing') speakFrom(run.current.i, { rate: r });
  }
  function skip(d) {
    const k = Math.max(0, Math.min(chunks.length - 1, run.current.i + d));
    run.current.i = k; setIndex(k);
    if (state === 'playing') speakFrom(k);
  }

  if (!supported || !chunks.length) return null;
  const pct = chunks.length ? Math.round((index / chunks.length) * 100) : 0;

  return (
    <section className={`listen${state !== 'idle' ? ' is-active' : ''}`} aria-label="Listen to this story">
      <div className="listen-main">
        <button type="button" className="listen-play" onClick={toggle} aria-label={state === 'playing' ? 'Pause' : state === 'paused' ? 'Resume' : 'Listen to this story'}>
          {state === 'playing'
            ? <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1" fill="#fff" /><rect x="14" y="4" width="4" height="16" rx="1" fill="#fff" /></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z" fill="#fff" /></svg>}
        </button>
        <div className="listen-info">
          <span className="listen-title">{state === 'playing' ? 'Listening…' : state === 'paused' ? 'Paused' : 'Listen to this story'}</span>
          <span className="listen-sub">{state === 'idle' ? `About ${Math.max(1, Math.round(minutes * 1.15 / rate))} min · ${voice ? label(voice) : 'Device voice'}` : `${pct}% · ${voice ? label(voice) : 'Device voice'}`}</span>
          {state !== 'idle' && <span className="listen-bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>}
        </div>
        {state !== 'idle' && (
          <div className="listen-ctrl">
            <button type="button" onClick={() => skip(-1)} aria-label="Previous sentence" title="Previous sentence"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="2.6" height="14" rx="1" fill="currentColor" /><path d="M19 5.5v13a.8.8 0 0 1-1.2.7L9 12.7a.8.8 0 0 1 0-1.4l8.8-6.5a.8.8 0 0 1 1.2.7z" fill="currentColor" /></svg></button>
            <button type="button" onClick={() => skip(1)} aria-label="Next sentence" title="Next sentence"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><rect x="16.4" y="5" width="2.6" height="14" rx="1" fill="currentColor" /><path d="M5 5.5v13a.8.8 0 0 0 1.2.7l8.8-6.5a.8.8 0 0 0 0-1.4L6.2 4.8A.8.8 0 0 0 5 5.5z" fill="currentColor" /></svg></button>
            <button type="button" onClick={stop} aria-label="Stop" title="Stop"><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" /></svg></button>
          </div>
        )}
        <button type="button" className="listen-settings" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Voice settings">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>
          <span>Voice</span>
        </button>
      </div>

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
          <p className="listen-note">US and UK English voices from your device — the list differs between phones and computers.</p>
        </div>
      )}
    </section>
  );
}

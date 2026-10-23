'use client';
import { useState } from 'react';

export default function CopyField({ value }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="copy-field">
      <input readOnly value={value} aria-label="Feed address" onFocus={(e) => e.target.select()} />
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} }}>
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

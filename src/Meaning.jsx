import { useEffect, useState } from 'react';
import { translate } from './translate.js';
import { langOf } from './langs.js';

const KEY = 'speakwise-meaning-online';
const readOnline = () => { try { return localStorage.getItem(KEY) !== '0'; } catch { return true; } };
const VIA = { phrasebook: 'offline phrasebook', correction: 'your correction', device: 'on-device translator', online: 'online translator', same: '' };

// Shows what the practice sentence MEANS in the language the learner already knows.
// Practice sentence (big, above)  +  this line (below)  =  two sentences side by side.
// Uses the app's own translate() engine: corrections -> phrasebook -> Chrome on-device -> MyMemory online (can be switched off).
export default function Meaning({ text, from, to, ctx }) {
  const [res, setRes] = useState(null), [online, setOnline] = useState(readOnline), [n, setN] = useState(0);
  const same = !text || from === to, id = [text, from, to, online, n].join('|');
  useEffect(() => {
    if (same) return undefined;
    let off = false;
    translate(text, from, to, { online })
      .then((r) => { if (!off) setRes({ id, r }); })
      .catch(() => { if (!off) setRes({ id, r: { text: '', via: 'none', error: 'Translation failed. Try again.' } }); });
    return () => { off = true; };
  }, [id, text, from, to, online, same]);
  const out = res && res.id === id ? res.r : null, busy = !same && !out; // busy until the answer for THIS sentence arrives
  if (same) return null;
  const toggle = (v) => { setOnline(v); try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* storage blocked */ } };
  const lang = langOf(to);
  return (<div className="meaning" role="group" aria-label={`Meaning in ${lang.name}`}>
    <p className="muted meaning-head">🌐 What it means in {lang.native} ({lang.name})</p>
    {busy && <p className="muted" role="status">Translating…</p>}
    {out && out.text && <p className="meaning-text" dir="auto" lang={lang.bcp}>{out.text}</p>}
    {out && out.text && VIA[out.via] && <p className="muted small">Source: {VIA[out.via]}. Machine translation can be imperfect.</p>}
    {out && !out.text && <p className="muted" role="status">{out.error || 'No translation found for this sentence.'}</p>}
    <div className="row">
      {out && !out.text && <button className="ghost small" onClick={() => setN(n + 1)}>↻ Try again</button>}
      <label className="muted small"><input type="checkbox" checked={online} onChange={(e) => toggle(e.target.checked)} /> Allow online translation (sends this sentence to the free MyMemory service when no offline engine can translate it)</label>
    </div>
  </div>);
}
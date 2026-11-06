import { useMemo, useState } from 'react';
import { SCRAMBLE, BUILDER, MISTAKES } from './data.js';

const shuffle = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const Feedback = ({ r, t, extra }) => r == null ? null : (
  <p className={`fb ${r}`} role="status">{r === 'ok' ? '✓ ' + t.great : '✗ ' + t.again}{extra ? ' ' + extra : ''}</p>
);

export function Scramble({ ctx: { award, addMistake, t } }) {
  const [i, setI] = useState(0), [g, setG] = useState(''), [r, setR] = useState(null), [h, setH] = useState(0);
  const q = SCRAMBLE[i % SCRAMBLE.length];
  const mix = useMemo(() => { let m; do m = shuffle(q.w.split('')); while (m.join('') === q.w); return m.join(' '); }, [i]);
  const check = () => {
    if (r) return; // duplicate-click guard
    if (g.trim().toUpperCase() === q.w) { setR('ok'); award(Math.max(4, 10 - h * 3), 'scramble'); }
    else { setR('no'); addMistake(g.trim() || '(blank)', q.w.toLowerCase(), 'Spelling: ' + q.hint); }
  };
  const next = () => { setI(i + 1); setG(''); setR(null); setH(0); };
  return (<div className="card">
    <h3>Word scramble</h3>
    <p className="big tiles">{mix}</p>
    {h > 0 && <p>🦊 {q.hint}</p>}{h > 1 && <p>हिंदी: {q.hi}</p>}
    <input aria-label="Your answer" value={g} onChange={(e) => setG(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && check()} />
    <div className="row"><button onClick={check}>{t.check}</button><button className="ghost" onClick={() => setH(Math.min(h + 1, 2))}>{t.hint}</button><button className="ghost" onClick={next}>{t.next}</button></div>
    <Feedback r={r} t={t} extra={r === 'no' ? '' : ''} />
  </div>);
}

export function Builder({ ctx: { award, addMistake, t } }) {
  const [i, setI] = useState(0), [pick, setPick] = useState([]), [r, setR] = useState(null);
  const ans = BUILDER[i % BUILDER.length];
  const pool = useMemo(() => shuffle(ans.map((w, k) => ({ w, k }))), [i]);
  const toggle = (k) => !r && setPick(pick.includes(k) ? pick.filter((x) => x !== k) : [...pick, k]);
  const check = () => {
    if (r) return;
    const s = pick.map((k) => ans[k]).join(' ');
    // compare by words, so duplicate words in different positions still count
    if (s === ans.join(' ')) { setR('ok'); award(10, 'builder'); }
    else { setR('no'); addMistake(s || '(empty)', ans.join(' ') + '.', 'Word order: put the subject first, then the verb.'); }
  };
  const next = () => { setI(i + 1); setPick([]); setR(null); };
  return (<div className="card">
    <h3>Sentence builder</h3>
    <p className="answer" aria-live="polite">{pick.length ? pick.map((k) => ans[k]).join(' ') : 'Tap the words in order…'}</p>
    <div className="row">{pool.map(({ w, k }) => <button key={k} className={pick.includes(k) ? 'tile used' : 'tile'} onClick={() => toggle(k)}>{w}</button>)}</div>
    <div className="row"><button onClick={check}>{t.check}</button><button className="ghost" onClick={() => setPick([])}>Clear</button><button className="ghost" onClick={next}>{t.next}</button></div>
    <Feedback r={r} t={t} />
  </div>);
}

export function FindMistake({ ctx: { award, addMistake, t } }) {
  const [i, setI] = useState(0), [r, setR] = useState(null);
  const q = MISTAKES[i % MISTAKES.length];
  const opts = useMemo(() => shuffle([q.bad, q.good]), [i]);
  const choose = (o) => {
    if (r) return;
    if (o === q.good) { setR('ok'); award(10, 'mistake'); } else { setR('no'); addMistake(q.bad, q.good, q.why); }
  };
  return (<div className="card">
    <h3>Find the correct sentence</h3>
    <div className="col">{opts.map((o) => <button key={o} className="opt" onClick={() => choose(o)}>{o}</button>)}</div>
    <Feedback r={r} t={t} extra={r ? '🦉 ' + q.why : ''} />
    <div className="row"><button className="ghost" onClick={() => { setI(i + 1); setR(null); }}>{t.next}</button></div>
  </div>);
}

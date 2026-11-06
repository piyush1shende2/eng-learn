import { useMemo, useRef, useState } from 'react';
import { PHONE } from './data2.js';

export const sh = (a) => [...a].sort(() => Math.random() - 0.5);
const norm = (s) => s.trim().toLowerCase().replace(/\s+/g, ' ');
import { speak, canSpeak, chime } from './speech.js';
export { speak, canSpeak };

// One engine for every multiple-choice / typed-answer puzzle (modes: choice, type, fix, letter).
export function Quiz({ spec, ctx }) {
  const { award, addMistake, t } = ctx;
  const [round, setRound] = useState(0), [i, setI] = useState(0), [val, setVal] = useState(''), [res, setRes] = useState(null), [score, setScore] = useState(0), [end, setEnd] = useState(false);
  const bonus = useRef(false);
  const items = useMemo(() => sh(spec.items).slice(0, 8), [spec, round]);
  const q = items[i];
  const opts = useMemo(() => (q && q.o ? sh(q.o) : null), [q]);
  const scr = useMemo(() => {
    if (!q || !q.scr) return null; let m, n = 0;
    do m = sh(q.a.split('')); while (m.join('') === q.a && n++ < 10);
    return m.join(' ').toUpperCase();
  }, [q]);

  const submit = (ans) => {
    if (res || !q) return; // duplicate-click guard
    const a = String(ans);
    const ok = spec.mode === 'choice' ? a === q.a
      : spec.mode === 'fix' ? a.trim().replace(/\s+/g, ' ') === q.a
      : spec.mode === 'letter' ? /^[a-z]{3,}$/.test(norm(a)) && norm(a)[0] === q.a && norm(a) !== q.w
      : norm(a) === norm(q.a);
    setRes(ok ? 'ok' : 'no'); chime(ok);
    if (ok) { setScore((s) => s + 1); award(8, spec.id); }
    else if (spec.mode !== 'letter') addMistake(a.trim() || '(blank)', q.a, q.why || spec.title);
  };
  const next = () => {
    if (i + 1 >= items.length) {
      if (score / items.length >= 0.7 && !bonus.current) { bonus.current = true; award(10, spec.id + '-round'); }
      setEnd(true);
    } else { setI(i + 1); setVal(''); setRes(null); }
  };
  const again = () => { setRound(round + 1); setI(0); setVal(''); setRes(null); setScore(0); setEnd(false); bonus.current = false; };

  if (end) return (<div className="card"><h3>{spec.title}: round finished</h3><p className="big">{score} / {items.length}</p>
    <p>{score / items.length >= 0.7 ? '🌟 Bonus XP earned for a strong round!' : 'Good effort. Mistakes are saved in your notebook so you can practise them.'}</p>
    <button onClick={again}>Play another round</button></div>);
  return (<div className="card">
    <h3>{spec.title}</h3><p className="muted">{spec.intro}</p>
    <p className="muted">Question {i + 1} of {items.length}</p>
    {q.e && <p className="emoji" aria-hidden="true">{q.e}</p>}
    <p className="big">{q.q} {q.say && canSpeak && <button className="ghost" aria-label="Hear the question" onClick={() => speak(q.q)}>🔊</button>}</p>
    {scr && <p className="big tiles">{scr}</p>}
    {opts ? <div className="col">{opts.map((o) => <button key={o} className="opt" onClick={() => submit(o)}>{o}</button>)}</div>
      : <div className="row"><input aria-label="Your answer" value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit(val)} /><button onClick={() => submit(val)}>{t.check}</button></div>}
    {res && <p className={`fb ${res}`} role="status">{res === 'ok' ? '✓ ' + t.great : '✗ ' + t.again} {res === 'no' && spec.mode !== 'letter' ? `Answer: ${q.a}. ` : ''}{q.why && spec.mode !== 'letter' ? q.why : ''}</p>}
    {res && <button className="ghost" onClick={next}>{i + 1 >= items.length ? 'Finish' : t.next}</button>}
  </div>);
}

// Put the lines of a conversation in the right order.
export function OrderGame({ ctx: { award, addMistake, t } }) {
  const [i, setI] = useState(0), [pick, setPick] = useState([]), [r, setR] = useState(null);
  const d = PHONE[i % PHONE.length];
  const pool = useMemo(() => sh(d.lines.map((l, k) => ({ l, k }))), [i]);
  const toggle = (k) => !r && setPick(pick.includes(k) ? pick.filter((x) => x !== k) : [...pick, k]);
  const check = () => {
    if (r || pick.length !== d.lines.length) return;
    const ok = pick.every((k, n) => k === n);
    setR(ok ? 'ok' : 'no');
    if (ok) award(12, 'phone'); else addMistake(pick.map((k) => d.lines[k]).join(' / '), d.lines.join(' / '), 'Conversation order: greeting first, thanks or goodbye last.');
  };
  return (<div className="card"><h3>Phone call order: {d.title}</h3>
    <p className="muted">Tap the lines in the order they would be said.</p>
    <ol className="answer">{pick.map((k) => <li key={k}>{d.lines[k]}</li>)}</ol>
    <div className="col">{pool.map(({ l, k }) => <button key={k} className={pick.includes(k) ? 'opt used' : 'opt'} onClick={() => toggle(k)}>{l}</button>)}</div>
    <div className="row"><button onClick={check}>{t.check}</button><button className="ghost" onClick={() => setPick([])}>Clear</button><button className="ghost" onClick={() => { setI(i + 1); setPick([]); setR(null); }}>{t.next}</button></div>
    {r && <p className={`fb ${r}`} role="status">{r === 'ok' ? '✓ ' + t.great : '✗ ' + t.again}</p>}
  </div>);
}

const N = 9, WORDS = ['cupcake', 'football', 'airport', 'jackpot', 'cowboy', 'fishbowl'];
function makeGrid() {
  const g = Array(N * N).fill('');
  for (const w of sh(WORDS)) {
    for (let tries = 0; tries < 200; tries++) {
      const v = Math.random() < 0.5, x = Math.floor(Math.random() * (v ? N : N - w.length + 1)), y = Math.floor(Math.random() * (v ? N - w.length + 1 : N));
      const cells = [...w].map((c, k) => (v ? (y + k) * N + x : y * N + x + k));
      if (cells.every((c, k) => !g[c] || g[c] === w[k])) { cells.forEach((c, k) => (g[c] = w[k])); break; }
    }
  }
  return g.map((c) => c || 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]);
}
export function WordSearch({ ctx: { award } }) {
  const [g, setG] = useState(makeGrid), [a, setA] = useState(null), [found, setFound] = useState([]), [msg, setMsg] = useState('');
  const bonus = useRef(false);
  const click = (c) => {
    if (a === null) { setA(c); setMsg(''); return; }
    const x1 = a % N, y1 = (a / N) | 0, x2 = c % N, y2 = (c / N) | 0, dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1);
    const len = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) + 1;
    setA(null);
    if (!(x1 === x2 || y1 === y2 || Math.abs(x2 - x1) === Math.abs(y2 - y1))) { setMsg('Pick two letters in a straight line.'); return; }
    const cells = Array.from({ length: len }, (_, k) => (y1 + dy * k) * N + x1 + dx * k);
    const s = cells.map((k) => g[k]).join(''), w = WORDS.find((x) => x === s || x === [...s].reverse().join(''));
    if (!w) { setMsg('Not one of the words. Try again.'); return; }
    if (found.some((f) => f.w === w)) return;
    const nf = [...found, { w, cells }]; setFound(nf); setMsg(`Found "${w}"!`); award(6, 'wordsearch');
    if (nf.length === WORDS.length && !bonus.current) { bonus.current = true; award(15, 'wordsearch-all'); }
  };
  const lit = new Set(found.flatMap((f) => f.cells));
  return (<div className="card"><h3>Compound word search</h3>
    <p className="muted">Tap the first and last letter of a word. Words run across or down.</p>
    <div className="grid" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>{g.map((c, k) => <button key={k} aria-label={`Letter ${c}`} className={'cell' + (lit.has(k) ? ' found' : '') + (a === k ? ' sel' : '')} onClick={() => click(k)}>{c}</button>)}</div>
    <p>{WORDS.map((w) => <span key={w} className={'badge' + (found.some((f) => f.w === w) ? ' on' : '')}>{w}</span>)}</p>
    <p role="status" className="muted">{msg}{found.length === WORDS.length ? ' 🎉 All words found!' : ''}</p>
    <button className="ghost" onClick={() => { setG(makeGrid()); setFound([]); setA(null); setMsg(''); bonus.current = false; }}>New grid</button>
  </div>);
}

const M = 7;
function genMaze() {
  const c = Array.from({ length: M * M }, () => ({ n: 1, e: 1, s: 1, w: 1 })), seen = new Set([0]), st = [0];
  while (st.length) {
    const p = st[st.length - 1], x = p % M, y = (p / M) | 0, nb = [];
    if (y > 0 && !seen.has(p - M)) nb.push([p - M, 'n', 's']); if (y < M - 1 && !seen.has(p + M)) nb.push([p + M, 's', 'n']);
    if (x < M - 1 && !seen.has(p + 1)) nb.push([p + 1, 'e', 'w']); if (x > 0 && !seen.has(p - 1)) nb.push([p - 1, 'w', 'e']);
    if (!nb.length) { st.pop(); continue; }
    const [d, a, b] = nb[Math.floor(Math.random() * nb.length)]; c[p][a] = 0; c[d][b] = 0; seen.add(d); st.push(d);
  }
  return c;
}
const DIR = { n: -M, s: M, e: 1, w: -1 }, KEYS = { ArrowUp: 'n', ArrowDown: 's', ArrowRight: 'e', ArrowLeft: 'w' };
export function Maze({ ctx: { award } }) {
  const [maze, setMaze] = useState(genMaze), [pos, setPos] = useState(0), [won, setWon] = useState(false);
  const go = (d) => {
    if (won || maze[pos][d]) return;
    const np = pos + DIR[d]; setPos(np);
    if (np === M * M - 1) { setWon(true); award(15, 'maze'); }
  };
  const border = (c) => ({ borderTop: c.n ? '3px solid #3f5b4e' : '3px solid transparent', borderBottom: c.s ? '3px solid #3f5b4e' : '3px solid transparent', borderLeft: c.w ? '3px solid #3f5b4e' : '3px solid transparent', borderRight: c.e ? '3px solid #3f5b4e' : '3px solid transparent' });
  return (<div className="card" tabIndex={0} onKeyDown={(e) => KEYS[e.key] && (e.preventDefault(), go(KEYS[e.key]))}>
    <h3>Maze: help the squirrel find the carrot</h3>
    <p className="muted">Use the arrow keys or the buttons. Learn the direction words: up, down, left, right.</p>
    <div className="grid maze" style={{ gridTemplateColumns: `repeat(${M}, 1fr)` }}>{maze.map((c, k) => <div key={k} className="mcell" style={border(c)}>{k === pos ? '🐿️' : k === M * M - 1 ? '🥕' : ''}</div>)}</div>
    <div className="row"><button onClick={() => go('n')}>Go up</button><button onClick={() => go('w')}>Go left</button><button onClick={() => go('s')}>Go down</button><button onClick={() => go('e')}>Go right</button></div>
    {won && <p className="fb ok" role="status">🥕 You found it! Great work.</p>}
    <button className="ghost" onClick={() => { setMaze(genMaze()); setPos(0); setWon(false); }}>New maze</button>
  </div>);
}

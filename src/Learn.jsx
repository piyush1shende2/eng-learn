import { useState } from 'react';
import { QA, CHAPTERS, FEELINGS, DAYS, DAYP, IRREGULAR } from './data2.js';
import { speak, canSpeak } from './engine.jsx';
import { phraseSet, langOf } from './langs.js';

const Say = ({ text }) => canSpeak ? <button className="ghost small" aria-label={`Hear: ${text}`} onClick={() => speak(text)}>🔊</button> : null;
const SECTIONS = { cards: 'Daily conversations', work: 'Workplace English', feel: 'Feelings', days: '60-day path', grammar: 'Grammar' };

function Cards() {
  return (<div className="card"><h3>20 everyday conversations</h3><p className="muted">Listen, then say both lines aloud.</p>
    {QA.map(([q, a], n) => <div key={q} className="mistake"><p><strong>{n + 1}. {q}</strong> <Say text={q} /></p><p>→ {a} <Say text={a} /></p></div>)}</div>);
}
function Work() {
  const [c, setC] = useState(0); const [name, words] = CHAPTERS[c];
  return (<div className="card"><h3>Workplace English: {name}</h3>
    <div className="row pills">{CHAPTERS.map(([n], k) => <button key={n} className={c === k ? 'tab on' : 'tab'} onClick={() => setC(k)}>{n}</button>)}</div>
    {words.map(([w, d]) => <p key={w}><strong>{w}</strong> <Say text={w} /> : {d}</p>)}
    <p className="muted">Practise these words in Puzzles → Workplace word meanings.</p></div>);
}
function Feel() {
  return (<div className="card"><h3>Say how you feel</h3><p className="muted">Useful expressions for talking about emotions. Make your own sentence with each one.</p>
    {FEELINGS.map(([f, a, b]) => <div key={f} className="mistake"><p><strong>{f}</strong></p><p>“{a}” <Say text={a} /></p><p>“{b}” <Say text={b} /></p></div>)}</div>);
}
function Days({ ctx: { s, award } }) {
  const [d, setD] = useState(null);
  const done = (n) => s.done['day' + n] > 0;
  const finished = DAYS.filter((_, k) => done(k + 1)).length;
  if (d === null) return (<div className="card"><h3>60-day speaking path</h3><p className="muted">{finished} of 60 days practised. Pick a day.</p>
    <div className="days">{DAYS.map((t, k) => <button key={k} className={done(k + 1) ? 'day on' : 'day'} onClick={() => setD(k + 1)} aria-label={`Day ${k + 1}: ${t}${done(k + 1) ? ', practised' : ''}`}>{done(k + 1) ? '✈️' : k + 1}</button>)}</div></div>);
  const ph = DAYP[d];
  return (<div className="card"><h3>Day {d}: {DAYS[d - 1]}</h3>
    {ph ? ph.map((p) => <p key={p}>“{p}” <Say text={p} /></p>) : <p className="muted">{DAYS[d - 1].startsWith('Test') ? 'Review week: play any three puzzles as your test.' : 'Sample sentences for this day are not added yet.'}</p>}
    <div className="row"><button onClick={() => !done(d) && award(10, 'day' + d)} disabled={done(d)}>{done(d) ? 'Practised ✓' : 'I practised this day'}</button><button className="ghost" onClick={() => setD(null)}>All days</button></div></div>);
}
function Grammar() {
  return (<div className="card"><h3>Grammar notes</h3>
    <h4>Present simple (habits, routines, facts)</h4>
    <p>I / you / we / they + base verb: <em>I play football.</em><br />He / she / it + verb + s: <em>She plays football.</em></p>
    <p>Negative: do not / does not + base verb: <em>He does not like tea.</em><br />Question: Do / Does + subject + base verb: <em>Does she like tea?</em></p>
    <p className="muted">After does, use the base verb.</p>
    <h4>Verb "to be"</h4><p>I <strong>am</strong> · he / she / it <strong>is</strong> · you / we / they <strong>are</strong></p>
    <h4>Irregular past verbs</h4><p>{IRREGULAR.map(([b, a]) => `${b} → ${a}`).join(' · ')}</p></div>);
}
function Phrasebook({ ctx: { s } }) {
  const tg = s.target || 'en', kn = s.known || 'en', P = phraseSet(tg), K = phraseSet(kn);
  return (<div className="card"><h3>Phrasebook: {langOf(tg).name} <span className="muted">({langOf(tg).native})</span></h3>
    {tg === kn && <p className="muted">Choose a different language under “I know” to see the meanings.</p>}
    {P.map((p, n) => <div key={n} className="mistake"><p><strong lang={langOf(tg).bcp}>{p}</strong> <Say text={p} /></p>{tg !== kn && <p className="muted" lang={langOf(kn).bcp}>{K[n]}</p>}</div>)}
    {tg !== 'en' && <p className="muted">More lessons for this language are planned. Use Speak, Accents, Writing, Words and Puzzles to practise these phrases.</p>}</div>);
}
const ALL = { phrases: ['Phrasebook', Phrasebook], cards: ['Daily conversations', Cards], work: ['Workplace English', Work], feel: ['Feelings', Feel], days: ['60-day path', Days], grammar: ['Grammar', Grammar] };
export default function Learn({ ctx }) {
  const isEn = (ctx.s.target || 'en') === 'en', keys = isEn ? Object.keys(ALL) : ['phrases'];
  const [sec0, setSec] = useState(isEn ? 'cards' : 'phrases'), sec = keys.includes(sec0) ? sec0 : keys[0], View = ALL[sec][1];
  return (<><div className="row pills">{keys.map((k) => <button key={k} className={sec === k ? 'tab on' : 'tab'} onClick={() => setSec(k)}>{ALL[k][0]}</button>)}</div><View ctx={ctx} /></>);
}

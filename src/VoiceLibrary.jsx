import { useMemo, useRef, useState } from 'react';
import { useVoices, voiceUrl } from './voices.js';
import { tokenize } from './speech.js';
import { Karaoke, Attempt } from './Attempt.jsx';
import RecordCompare from './RecordCompare.jsx';
import Meaning from './Meaning.jsx';

const EMO = { neutral: 'calm, normal', amused: 'smiling, amused', angry: 'angry, sharp', disgusted: 'disgusted', drunk: 'slurred and slow (recorded sober)', sleepy: 'tired and slow', surprised: 'surprised, rising', whisper: 'whispered' };
const sh = (a) => [...a].sort(() => Math.random() - 0.5);

// Plays a real recording and lights up the words in step with it. Word timing is approximate (by letters).
export function ClipPlayer({ text, file }) {
  const tk = tokenize(text, 'en'), cum = useMemo(() => { let s = 0; return tk.map((w) => (s += w.length + 1)); }, [text]);
  const a = useRef(), [pos, setPos] = useState(-1), [on, setOn] = useState(false);
  const tick = () => { const el = a.current; if (!el || !el.duration) return; const r = el.currentTime / el.duration, i = cum.findIndex((c) => c / cum[cum.length - 1] >= r); setPos(i < 0 ? tk.length : i); };
  const play = (rate) => { const el = a.current; if (!el) return; el.playbackRate = rate; el.currentTime = 0; el.play().catch(() => {}); };
  return (<div>
    <Karaoke tokens={tk} st={tk.map((_, i) => (i < pos ? 'ok' : null))} pos={on ? pos : -1} legend={false} />
    <audio ref={a} key={file} src={voiceUrl(file)} controls preload="metadata" onPlay={() => setOn(true)} onPause={() => setOn(false)} onEnded={() => { setOn(false); setPos(tk.length); }} onTimeUpdate={tick} />
    <div className="row"><button onClick={() => play(1)}>▶ Play</button><button className="ghost" onClick={() => play(0.7)}>🐢 Slow</button></div>
  </div>);
}

// Real human voices from public datasets: German (8 emotions), Italian, Czech, Central Kurdish, Otomi.
export default function VoiceLibrary({ ctx, initial }) {
  const man = useVoices(), { award } = ctx;
  const [li, setLi] = useState(-1), [ci, setCi] = useState(0), [emo, setEmo] = useState('neutral'), [now, setNow] = useState(''), [q, setQ] = useState(null), [res, setRes] = useState(null);
  const token = useRef(0);
  if (man === undefined) return null;
  if (man === null) return (<div className="card"><h3>🎙 Real voice library</h3><p>No voice library is installed. Run <code>python tools/build_voice_library.py</code> on your datasets (see the README).</p></div>);
  const libs = man.libraries, idx = li >= 0 ? li : Math.max(0, libs.findIndex((l) => l.lang === initial)), lib = libs[idx % libs.length], clip = lib.clips[ci % lib.clips.length];
  const isEmo = lib.kind === 'emotion', file = isEmo ? clip.emotions[emo] || clip.file : clip.file;
  const ctx2 = { ...ctx, s: { ...ctx.s, target: lib.lang, voice: { ...ctx.s.voice, accent: lib.rec || 'en-US' } } };
  const halt = () => { token.current++; setNow(''); };
  const playAll = () => {
    const my = ++token.current; let k = 0;
    const next = () => {
      if (my !== token.current || k >= lib.emotions.length) { setNow(''); return; }
      const e = lib.emotions[k++]; setNow(e + ' (' + EMO[e] + ')'); setEmo(e);
      const a = new Audio(voiceUrl(clip.emotions[e])); a.onended = next; a.onerror = next; a.play().catch(next);
    };
    next();
  };
  const newQ = () => { const c = lib.clips[Math.floor(Math.random() * lib.clips.length)], e = lib.emotions[Math.floor(Math.random() * lib.emotions.length)]; setQ({ c, e, opts: sh([e, ...sh(lib.emotions.filter((x) => x !== e)).slice(0, 3)]) }); setRes(null); };
  const answer = (o) => { if (res) return; const ok = o === q.e; setRes(ok ? 'ok' : 'no'); if (ok) award(8, 'guess-emotion'); };
  return (<div className="card"><h3>🎙 Real voice library</h3>
    <p className="muted">Real recordings of real speakers, so the sound is not a computer voice. Choose a language, then listen, follow the words, say it yourself and compare.</p>
    <div className="row">
      <label>Language <select value={idx % libs.length} onChange={(e) => { halt(); setLi(+e.target.value); setCi(0); setQ(null); }}>{libs.map((l, k) => <option key={l.id} value={k}>{l.name}</option>)}</select></label>
      <label>Sentence <select value={ci % lib.clips.length} onChange={(e) => { halt(); setCi(+e.target.value); }}>{lib.clips.map((c, k) => <option key={c.id} value={k}>{c.text.slice(0, 44)}</option>)}</select></label>
      <button className="ghost" onClick={() => { halt(); setCi((ci + 1) % lib.clips.length); }}>Next →</button>
    </div>
    <p className="muted">Speaker: {lib.speaker}</p>
    {isEmo && <><div className="row pills">{lib.emotions.map((e) => <button key={e} className={emo === e ? 'tab on' : 'tab'} onClick={() => { halt(); setEmo(e); }} title={EMO[e]}>{e}</button>)}</div>
      <p className="muted">Same sentence, different feeling: {EMO[emo]}. Listen for pitch, speed and volume.</p>
      <div className="row"><button className="ghost" onClick={now ? halt : playAll}>{now ? '⏹ Stop' : '🎭 Hear all 8 emotions'}</button>{now && <span role="status">Now: <strong>{now}</strong></span>}</div></>}
    <p className="muted practice-label">🎯 Practise this ({lib.name.split(' (')[0]})</p>
    <p className="big" dir="auto">{clip.text}</p>
    <Meaning text={clip.text} from={lib.lang} to={ctx.s.known || 'en'} ctx={ctx} />
    <ClipPlayer text={clip.text} file={file} />
    <details><summary>🎤 {lib.rec ? 'Say or type this sentence' : 'Type this sentence'}</summary><Attempt key={file} variants={clip.text} ctx={ctx2} typeOnly={!lib.rec} noTts /></details>
    <RecordCompare text={clip.text} refUrl={voiceUrl(file)} />
    {isEmo && <><h4>Guess the emotion</h4>{!q ? <button onClick={newQ}>Start</button> : (<div><audio key={q.c.emotions[q.e]} src={voiceUrl(q.c.emotions[q.e])} controls /><div className="row">{q.opts.map((o) => <button key={o} className="opt" onClick={() => answer(o)}>{o}</button>)}</div>
      {res && <p className={`fb ${res}`} role="status">{res === 'ok' ? '✓ Correct!' : `✗ It was ${q.e}.`} <button className="ghost small" onClick={newQ}>Next</button></p>}</div>)}</>}
    <p className="muted">{lib.credit} Licence: {lib.license}. {lib.license.includes('SA') ? 'Share-alike: keep the attribution and release any adaptation of these recordings under the same licence.' : ''}</p>
  </div>);
}
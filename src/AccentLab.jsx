import { useMemo, useState } from 'react';
import { speak, canSpeak } from './speech.js';
import { Attempt } from './Attempt.jsx';
import { ACCENTS, ACCENT_IDS, FEATURES, WORDS, L1, L1_IDS, compareWord, overview } from './accentData.js';
import { useAccents, accentUrl, findClip, findL1Clip } from './accentManifest.js';

// "Same word, different accents": pick two accents and a word, hear both, and see exactly which sounds differ and why.
function Real({ hit, label }) {
  if (!hit) return <p className="muted">No real recording of this word is installed for {label}. Run the data build (see the README) to add some.</p>;
  return (<div className="real">
    <audio src={accentUrl(hit.c.file)} controls preload="none" />
    <p className="muted">Real speaker {hit.s.id} ({hit.g.label}) says: “{hit.c.text}”</p>
  </div>);
}

function Side({ cmp, side, man, vs, ctx }) {
  const { s } = ctx, v = s.voice || {};
  const acc = ACCENTS[side.id], hit = useMemo(() => findClip(man, side.id, cmp.word), [man, side.id, cmp.word]);
  return (<div className="side">
    <h4>{acc.short}</h4>
    <p className="ipa" lang="en-fonipa">/{side.ipa}/</p>
    <p className="say">{side.say}</p>
    <button onClick={() => speak(cmp.word, { accent: acc.voice, style: v.style, rate: v.rate || 0.85 })} disabled={!canSpeak} aria-label={`Computer voice, ${acc.short}`}>🔊 Computer voice</button>
    {acc.voice === vs.voice && <p className="muted">Your device may use the same voice for both accents. Use the real recordings.</p>}
    {man !== undefined && <Real hit={hit} label={acc.short} />}
  </div>);
}

export default function AccentLab({ ctx }) {
  const man = useAccents();
  const [wi, setWi] = useState(0), [a, setA] = useState('in'), [b, setB] = useState('us'), [l1, setL1] = useState('hindi');
  const word = WORDS[wi % WORDS.length], cmp = compareWord(word, a, b), all = useMemo(() => overview(a, b), [a, b]);
  const l1hit = useMemo(() => findL1Clip(man, l1), [man, l1]), note = L1[l1];
  const say = (w) => { speak(w, { accent: ACCENTS[b].voice, style: (ctx.s.voice || {}).style, rate: (ctx.s.voice || {}).rate || 0.85 }); };

  return (<div className="card lab">
    <h3>🔬 Accent Lab: same word, different accents</h3>
    <p className="muted">Pick two accents and a word. You will see how each accent says it, and exactly which sounds change and why.</p>
    <div className="row">
      <label>Accent A <select value={a} onChange={(e) => setA(e.target.value)}>{ACCENT_IDS.map((id) => <option key={id} value={id}>{ACCENTS[id].name}</option>)}</select></label>
      <button className="ghost" onClick={() => { setA(b); setB(a); }} aria-label="Swap accents">⇄</button>
      <label>Accent B <select value={b} onChange={(e) => setB(e.target.value)}>{ACCENT_IDS.map((id) => <option key={id} value={id}>{ACCENTS[id].name}</option>)}</select></label>
    </div>
    <div className="row pills" role="group" aria-label="Choose a word">{WORDS.map((w, k) => <button key={w.word} className={k === wi % WORDS.length ? 'tab on' : 'tab'} onClick={() => setWi(k)}>{w.word}</button>)}</div>

    {a === b ? <p className="fb no" role="status">Choose two different accents to compare.</p> : (<>
      <div className="cols">
        <Side cmp={cmp} side={cmp.a} man={man} vs={ACCENTS[b]} ctx={ctx} />
        <Side cmp={cmp} side={cmp.b} man={man} vs={ACCENTS[a]} ctx={ctx} />
      </div>
      {cmp.note && <p className="muted">💡 {cmp.note}</p>}
      <h4>Why “{cmp.word}” sounds different</h4>
      {cmp.diffs.length === 0 ? <p>{ACCENTS[a].short} and {ACCENTS[b].short} say “{cmp.word}” almost the same way. Try another word.</p> : (
        <ol className="why">{cmp.diffs.map((d) => (<li key={d.id}>
          <strong>{d.title}</strong>
          <p><b>{ACCENTS[a].short}</b> {d.a}</p>
          <p><b>{ACCENTS[b].short}</b> {d.b}</p>
          <p className="muted">🦜 {d.tip}</p>
        </li>))}</ol>)}
      <details><summary>🎤 Say “{cmp.word}” yourself</summary><Attempt key={cmp.word} variants={cmp.word} ctx={ctx} /></details>

      <details className="over"><summary>All differences between {ACCENTS[a].short} and {ACCENTS[b].short} ({all.length})</summary>
        {all.length === 0 ? <p>No modelled differences.</p> : <ul>{all.map((d) => (<li key={d.id}><strong>{d.title}.</strong> {ACCENTS[a].short} {d.a} {ACCENTS[b].short} {d.b}
          <div className="row pills">{d.words.map((w) => <button key={w} className="tab" onClick={() => { setWi(WORDS.findIndex((x) => x.word === w)); say(w); }}>🔊 {w}</button>)}</div></li>))}</ul>}
      </details>
    </>)}

    <h4>Why do learners from other languages sound different?</h4>
    <label>First language <select value={l1} onChange={(e) => setL1(e.target.value)}>{L1_IDS.map((id) => <option key={id} value={id}>{L1[id].name}</option>)}</select></label>
    <p className="muted">These are common tendencies, not rules for every speaker.</p>
    <ul>{note.notes.map((n) => <li key={n}>{n}</li>)}</ul>
    <div className="row pills" role="group" aria-label="Words to practise">{note.watch.map((w) => <button key={w} className="tab" onClick={() => say(w)}>🔊 {w}</button>)}</div>
    {man !== undefined && (l1hit ? (<div className="real"><audio src={accentUrl(l1hit.c.file)} controls preload="none" />
      <p className="muted">Real {note.name} speaker {l1hit.s.id}{l1hit.s.region ? ' (' + l1hit.s.region + ')' : ''} reads the English paragraph.</p></div>)
      : <p className="muted">No {note.name}-speaker recording is installed yet.</p>)}
    <p className="muted">Features modelled: {Object.values(FEATURES).map((f) => f.title.toLowerCase()).join('; ')}.</p>
  </div>);
}

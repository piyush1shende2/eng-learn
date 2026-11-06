import { useRef, useState } from 'react';
import { Attempt } from './Attempt.jsx';
import RecordCompare from './RecordCompare.jsx';
import Meaning from './Meaning.jsx';
import { useAccents, accentUrl } from './accentManifest.js';

const sh = (a) => [...a].sort(() => Math.random() - 0.5);
const FAMILY = { native: 'Native English accents', l1: 'English spoken by learners (first language)' };
const who = (s) => `${s.id} (${s.gender === 'F' ? 'woman' : s.gender === 'M' ? 'man' : 'speaker'}${s.age ? ', ' + s.age : ''}${s.region ? ', ' + s.region : ''})`;

// Real recordings of real speakers (built by tools/build_accent_data.py from VCTK and the Speech Accent Archive).
// <audio> playback travels through the browser tab, so it is also heard when you share a tab on Google Meet.
export default function HumanVoices({ ctx }) {
  const { award } = ctx, man = useAccents();
  const [gi, setGi] = useState(0), [si, setSi] = useState(0), [ci, setCi] = useState(0), [now, setNow] = useState('');
  const audio = useRef(), token = useRef(0), [q, setQ] = useState(null), [res, setRes] = useState(null);
  if (man === undefined) return null;
  if (man === null) {
    return (<div className="card"><h3>🎙 Real human accent recordings</h3>
      <p>No recordings are installed yet. Real speakers fix the “all accents sound the same” problem of computer voices. They are built once from your datasets and shipped with the app, so users download nothing extra.</p>
      <ol><li>Install the tools: <code>pip install -r tools/requirements.txt</code></li>
        <li>Build the clips: <code>python tools/build_accent_data.py --root &quot;F:/datasets&quot;</code></li>
        <li>Rebuild the app. The recordings appear here.</li></ol></div>);
  }

  const groups = man.groups, g = groups[gi % groups.length], sp = g.speakers[si % g.speakers.length], clip = sp.clips[ci % sp.clips.length];
  const families = [...new Set(groups.map((x) => x.family || 'native'))];
  const choose = (setter) => (e) => { setter(+e.target.value); if (setter === setGi) { setSi(0); setCi(0); } if (setter === setSi) setCi(0); };
  const play = (rate) => { const a = audio.current; if (!a) return; a.playbackRate = rate; a.currentTime = 0; a.play().catch(() => {}); };

  // Same sentence, one speaker per accent of the same kind, one after another.
  const compareAll = () => {
    const my = ++token.current, fam = g.family || 'native';
    const list = groups.filter((x) => (x.family || 'native') === fam)
      .map((gr) => [gr, gr.speakers.find((s) => s.clips.some((c) => c.utt === clip.utt))]).filter(([, s]) => s).slice(0, 12);
    let k = 0;
    const next = () => {
      if (my !== token.current || k >= list.length) { setNow(''); return; }
      const [gr, s] = list[k++], c = s.clips.find((x) => x.utt === clip.utt);
      setNow(`${gr.label} · speaker ${s.id}${s.region ? ' (' + s.region + ')' : ''}`);
      const a = new Audio(accentUrl(c.file)); a.onended = next; a.onerror = next; a.play().catch(next);
    };
    next();
  };
  const newQ = () => {
    const fam = g.family || 'native', pool = groups.filter((x) => (x.family || 'native') === fam);
    const gr = pool[Math.floor(Math.random() * pool.length)], s = gr.speakers[Math.floor(Math.random() * gr.speakers.length)], c = s.clips[Math.floor(Math.random() * s.clips.length)];
    setQ({ gr, c, opts: sh([gr, ...sh(pool.filter((x) => x !== gr)).slice(0, 2)]) }); setRes(null);
  };
  const answer = (o) => { if (res) return; const ok = o === q.gr; setRes(ok ? 'ok' : 'no'); if (ok) award(8, 'guess-accent'); };

  return (<div className="card"><h3>🎙 Real human accent recordings</h3>
    <div className="row">
      <label>Accent <select value={gi % groups.length} onChange={choose(setGi)}>
        {families.map((f) => <optgroup key={f} label={FAMILY[f] || f}>{groups.map((x, k) => ((x.family || 'native') === f ? <option key={x.id} value={k}>{x.label}</option> : null))}</optgroup>)}
      </select></label>
      <label>Speaker <select value={si % g.speakers.length} onChange={choose(setSi)}>{g.speakers.map((x, k) => <option key={x.id} value={k}>{who(x)}</option>)}</select></label>
      <label>Sentence <select value={ci % sp.clips.length} onChange={choose(setCi)}>{sp.clips.map((c, k) => <option key={c.utt + k} value={k}>{(c.text || c.utt).slice(0, 48)}</option>)}</select></label>
    </div>
    <p className="big">{clip.text}</p>
    <Meaning text={clip.text} from="en" to={ctx.s.known || 'en'} ctx={ctx} />
    <audio ref={audio} key={clip.file} src={accentUrl(clip.file)} controls preload="metadata" />
    <div className="row"><button onClick={() => play(1)}>▶ Play</button><button className="ghost" onClick={() => play(0.7)}>🐢 Slow</button>
      <button className="ghost" onClick={now ? () => { token.current++; setNow(''); } : compareAll}>{now ? '⏹ Stop' : '🌍 Compare accents'}</button></div>
    {now && <p role="status">Now playing: <strong>{now}</strong></p>}
    <details><summary>🎤 Say this sentence yourself</summary><Attempt key={clip.file} variants={clip.text} ctx={ctx} /></details>
    <RecordCompare text={clip.text} refUrl={accentUrl(clip.file)} />
    <h4>Guess the accent</h4>
    {!q ? <button onClick={newQ}>Start</button> : (<div>
      <audio key={q.c.file} src={accentUrl(q.c.file)} controls preload="metadata" />
      <div className="row">{q.opts.map((o) => <button key={o.id} className="opt" onClick={() => answer(o)}>{o.label}</button>)}</div>
      {res && <p className={`fb ${res}`} role="status">{res === 'ok' ? '✓ Correct!' : `✗ It was ${q.gr.label}.`} <button className="ghost small" onClick={newQ}>Next</button></p>}</div>)}
    <details><summary>Credits and licences</summary>
      <ul>{man.sources.map((x, k) => <li key={k}>{x.name}. Licence: {x.license}. {x.credit}</li>)}</ul></details>
  </div>);
}
import { useEffect, useRef, useState } from 'react';
import { SCENES } from './data3.js';
import { speak, canSpeak, personaStyle } from './speech.js';
import { Attempt } from './Attempt.jsx';
import { translate } from './translate.js';
import { langOf } from './langs.js';
import VoicePicker from './VoicePicker.jsx';

const BYE = 'Great talking with you! Have a nice day.';

function Scene({ sc, ctx, back }) {
  const { award, s } = ctx;
  const [msgs, setMsgs] = useState([{ f: 'ai', t: sc.steps[0][0], o: sc.orig && sc.orig.steps[0][0] }]), [step, setStep] = useState(0), [auto, setAuto] = useState(true);
  const lock = useRef(-1), endRef = useRef();
  const v = s.voice || { accent: 'en-US', style: 'w1', rate: 0.85 };
  const vv = v.variety !== false ? { ...v, style: personaStyle(sc.id) } : v; // each scene has its own speaker
  useEffect(() => { const l = msgs[msgs.length - 1]; if (auto && l.f === 'ai') speak(l.t, vv); if (endRef.current && endRef.current.scrollIntoView) endRef.current.scrollIntoView({ block: 'nearest' }); }, [msgs.length]);
  const cont = ({ heard }) => {
    if (lock.current === step) return; lock.current = step; // one reply per turn
    const nm = [...msgs, { f: 'me', t: heard }], ns = step + 1;
    if (ns >= sc.steps.length) { setMsgs([...nm, { f: 'ai', t: sc.bye || BYE, o: sc.orig && BYE }]); award(15, 'chat-' + sc.id); }
    else setMsgs([...nm, { f: 'ai', t: sc.steps[ns][0], o: sc.orig && sc.orig.steps[ns][0] }]);
    setStep(ns);
  };
  const finished = step >= sc.steps.length;
  return (<div className="card">
    <div className="row"><button className="ghost" onClick={back}>← Scenes</button><strong>{sc.e} {sc.title}</strong>
      <label><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Read AI aloud</label></div>
    <div className="chat" aria-live="polite">{msgs.map((m, i) => <div key={i} className={'bubble ' + m.f}>{m.f === 'ai' && <span aria-hidden="true">🦜 </span>}{m.t}{m.f === 'ai' && canSpeak && <button className="ghost small" aria-label="Hear this message" onClick={() => speak(m.t, vv)}>🔊</button>}{m.o && <div className="muted">{m.o}</div>}</div>)}<div ref={endRef} /></div>
    {finished ? <div><p className="fb ok">🎉 Conversation complete! XP added.</p><button onClick={back}>Choose another scene</button></div>
      : <div className="compose"><p className="muted">Your turn {step + 1} of {sc.steps.length}. Say or type the guided reply, or put it in your own words.</p>
        <Attempt key={step} variants={sc.steps[step][1]} ctx={ctx} onContinue={cont} /></div>}
  </div>);
}

// For languages other than English the scene is translated first (offline phrasebook, on-device or online translator).
function Translated({ sc, ctx, back }) {
  const tg = ctx.s.target, [res, setRes] = useState(null), [err, setErr] = useState('');
  useEffect(() => {
    let off = false;
    (async () => {
      const texts = [...sc.steps.flatMap(([a, r]) => [a, ...r]), BYE], out = [];
      for (const x of texts) { const r = await translate(x, 'en', tg); if (off) return; if (!r.text) { setErr(r.error || 'Translation is not available.'); return; } out.push(r.text); }
      let k = 0; const steps = sc.steps.map(([, r]) => [out[k++], r.map(() => out[k++])]);
      setRes({ ...sc, steps, bye: out[out.length - 1], orig: sc });
    })();
    return () => { off = true; };
  }, [sc.id, tg]);
  if (err) return <div className="card"><p className="fb no" role="alert">{err}</p><button onClick={back}>← Scenes</button></div>;
  if (!res) return <div className="card"><p role="status">Preparing this scene in {langOf(tg).name}…</p></div>;
  return <Scene sc={res} ctx={ctx} back={back} />;
}

export default function Chat({ ctx }) {
  const [sc, setSc] = useState(null), tg = ctx.s.target || 'en';
  if (sc) return tg === 'en' ? <Scene key={sc.id} sc={sc} ctx={ctx} back={() => setSc(null)} /> : <Translated key={sc.id + tg} sc={sc} ctx={ctx} back={() => setSc(null)} />;
  return (<><VoicePicker ctx={ctx} />
    <div className="card"><h3>Chat practice: {SCENES.length} scenes</h3>
      <p className="muted">The AI starts the conversation. You reply by speaking or typing, with guidance on what to say.{tg !== 'en' ? ` Scenes are translated into ${langOf(tg).name} automatically, so wording may sound less natural than hand-written lessons.` : ''}</p>
      <div className="row">{SCENES.map((x) => <button key={x.id} className="tab" onClick={() => setSc(x)}>{x.e} {x.title}{ctx.s.done['chat-' + x.id] ? ' ✓' : ''}</button>)}</div></div></>);
}

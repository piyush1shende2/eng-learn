import { useEffect, useMemo, useRef, useState } from 'react';
import { SR, speak, stopSpeak, listen, micError, tokenize, recogLang, nw, align, lev, grammarTips, chime } from './speech.js';
import MicCheck from './MicCheck.jsx';

// Dark guidance panel: white = already said, red = mistake, grey = still to say.
export function Karaoke({ tokens, st, pos, legend = true }) {
  return (<div><p className="kara" dir="auto">{tokens.map((w, i) => <span key={i} className={'w ' + (st[i] || '') + (i === pos ? ' cur' : '')}>{w}</span>)}</p>
    {legend && <p className="muted legend">White = said · <span className="redtxt">Red underlined = needs practice</span> · Grey = still to say</p>}</div>);
}

// One attempt at a line: speak it or type it, with live guidance and feedback.
export function Attempt({ variants, ctx, onContinue, threshold = 0.6, typeOnly, noTts }) {
  const { award, addMistake, s } = ctx;
  const tokz = (x) => tokenize(x, s.target || 'en');
  const vs = Array.isArray(variants) ? variants : [variants];
  const key = vs.join('|');
  const [mode, setMode] = useState(SR && !typeOnly ? 'speak' : 'type');
  const [heard, setHeard] = useState(''), [live, setLive] = useState(false), [res, setRes] = useState(null), [err, setErr] = useState('');
  const rec = useRef(null), started = useRef(false), [gentle, setGentle] = useState(true);
  const T = useMemo(() => vs.map((v) => tokz(v)), [key]);
  const hw = tokz(heard).map(nw).filter(Boolean), heardRef = useRef('');
  heardRef.current = heard;
  const scored = T.map((tk) => { const a = align(tk.map(nw), hw, !res, mode === 'speak' && gentle); return { tk, a, ok: a.st.filter((x) => x === 'ok').length / tk.length }; });
  const bi = scored.reduce((b, x, i) => (x.ok > scored[b].ok ? i : b), 0);
  const { tk, a } = scored[bi];

  const stop = () => { try { rec.current && rec.current.stop(); } catch { /* already stopped */ } setLive(false); };
  const tset = useMemo(() => new Set(T.flat().map(nw)), [T]);
  const start = () => {
    setErr(''); setHeard(''); setRes(null); started.current = true; stopSpeak(); // stop the AI voice so the mic does not hear it
    let failed = false;
    try {
      const lang = recogLang(s);
      rec.current = listen({ lang, score: (x) => tokz(x).map(nw).filter((w) => tset.has(w)).length, onText: setHeard,
        onEnd: () => { setLive(false); if (!failed && !heardRef.current) { setErr('I did not hear anything. Check your microphone with the test below, speak a little closer, and try again.'); started.current = false; } },
        onError: (e) => { failed = true; setErr(micError(e)); setLive(false); started.current = false; } });
      setLive(true);
    } catch { setErr(micError('start')); started.current = false; }
  };
  useEffect(() => () => { try { rec.current && rec.current.stop(); } catch { /* ignore */ } }, []);
  useEffect(() => { if (!live && started.current && heard && mode === 'speak' && !res) finish(); }, [live]);

  const finish = () => {
    if (res || !hw.length) return;
    stop(); started.current = false;
    const f = align(tk.map(nw), hw, false, mode === 'speak' && gentle), ok = f.st.filter((x) => x === 'ok').length, acc = ok / tk.length, report = [];
    f.st.forEach((x, i) => {
      if (x === 'bad') report.push({ w: tk[i], h: f.hd[i], why: lev(f.hd[i], nw(tk[i])) <= 2 ? 'Close! Check the spelling or pronunciation.' : 'A different word.' });
      else if (x === 'skip') report.push({ w: tk[i], h: '', why: 'This word was missed.' });
    });
    report.slice(0, 5).forEach((r) => addMistake(r.h || '(missed)', nw(r.w), 'Practice: ' + r.why));
    award(Math.round(acc * 12) + (acc >= 0.9 ? 5 : 0), 'speak-' + mode);
    chime(acc >= threshold);
    setRes({ acc, report, tips: mode === 'type' && (s.target || 'en') === 'en' ? grammarTips(heard) : [], left: Math.max(0, tk.length - f.pos) });
  };
  const reset = () => { stop(); setHeard(''); setRes(null); setErr(''); started.current = false; };
  const pickMode = (m) => { reset(); setMode(m); };

  return (<div>
    <div className="row pills">
      <button className={mode === 'speak' ? 'tab on' : 'tab'} disabled={!SR || !!typeOnly} onClick={() => pickMode('speak')}>🎤 Speak</button>
      <button className={mode === 'type' ? 'tab on' : 'tab'} onClick={() => pickMode('type')}>⌨️ Type</button>
      {!noTts && <button className="ghost" onClick={() => speak(vs[bi], { accent: s.voice && s.voice.accent, rate: s.voice ? s.voice.rate : 0.85 })}>🔊 Hear it</button>}
    </div>
    {!SR && <p className="muted">Speech recognition is not available in this browser (try Chrome or Edge). You can type instead.</p>}
    <Karaoke tokens={tk} st={a.st} pos={a.pos < tk.length ? a.pos : -1} />
    {mode === 'speak' ? (<>
      <div className="row"><button onClick={live ? stop : start} aria-pressed={live}>{live ? '⏹ Stop' : '🎤 Start speaking'}</button><button className="ghost" onClick={finish} disabled={!hw.length}>Check</button></div>
      <label className="muted"><input type="checkbox" checked={gentle} onChange={(e) => setGentle(e.target.checked)} /> Gentle matching (accept words that are one letter off)</label>
      <p className="muted">Press Stop when you finish. I keep listening through short pauses. The microphone starts only when you press the button, and this app does not record or save audio. In Chrome and Edge the browser's speech recognition may send your voice to its provider's servers.</p>
      {heard && <p className="muted">I heard: “{heard}”</p>}
      <details><summary>Microphone not working? Test it</summary><MicCheck /></details>
    </>) : (<div className="row"><input aria-label="Type the sentence" value={heard} disabled={!!res} placeholder="Type here and press Enter" onChange={(e) => setHeard(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && finish()} /><button onClick={finish} disabled={!hw.length}>Check</button></div>)}
    {err && <p className="fb no" role="alert">{err}</p>}
    {res && (<div className="result" role="status">
      <p className="big">{Math.round(res.acc * 100)}% of the words matched</p>
      {res.report.map((r, i) => <p key={i}>“{r.w}”{r.h ? <> → I got “{r.h}”</> : null}. {r.why}</p>)}
      {res.left > 0 && <p className="muted">{res.left} word(s) were not reached.</p>}
      {res.tips.map((tp) => <p key={tp}>💡 {tp}</p>)}
      <p className="muted">Speaking is judged by what the recogniser understood, so it shows clarity, not a full pronunciation score.</p>
      <div className="row">{onContinue && res.acc >= threshold && <button onClick={() => onContinue({ heard: heard.trim(), acc: res.acc })}>Continue</button>}<button className="ghost" onClick={reset}>Try again</button></div>
    </div>)}
  </div>);
}

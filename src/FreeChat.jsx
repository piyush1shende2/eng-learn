import { useEffect, useRef, useState } from 'react';
import { SR, speak, stopSpeak, listen, micError } from './speech.js';
import MicCheck from './MicCheck.jsx';
import { starters, firstMessage, reply } from './bot.js';
import { evaluate } from './evaluate.js';
import { Karaoke } from './Attempt.jsx';
import { downloads } from './exporters.js';
import VoicePicker from './VoicePicker.jsx';

const KEY = 'speakwise-freechat';
const load = () => { try { const d = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(d) && d.length) return d; } catch { /* ignore */ } return [firstMessage()]; };

// Corrected sentence in the white/red guide style, with the reasons below it.
const Fix = ({ ev }) => (<div className="fix">
  <Karaoke tokens={ev.toks.map((x) => x.w)} st={ev.toks.map((x) => (x.bad ? 'bad' : 'ok'))} pos={-1} legend={false} />
  {ev.errors.length ? ev.errors.map((e, i) => <p key={i} className="muted">✗ <s>{e.from}</s> → <strong>{e.to}</strong> · {e.why}</p>) : <p className="fb ok">✓ No mistakes found by my checks.</p>}
  {ev.clarity && <p className="muted">🎤 {ev.clarity}</p>}
  {ev.tips.map((t) => <p key={t} className="muted">🗣 Pronunciation tip: {t}</p>)}
</div>);

const DownloadRow = ({ msgs }) => (<div className="row"><span className="muted">Download:</span>
  <button className="ghost" onClick={() => downloads.pdf(msgs)}>PDF</button><button className="ghost" onClick={() => downloads.word(msgs)}>Word (.doc)</button><button className="ghost" onClick={() => downloads.text(msgs)}>Text</button></div>);

function Results({ msgs, ctx: { addMistake } }) {
  const [saved, setSaved] = useState(false);
  const me = msgs.filter((m) => m.from === 'me');
  if (!me.length) return <div className="card"><p>Say or type something first, then come back to see your results.</p></div>;
  const all = me.flatMap((m) => m.ev.errors), perfect = me.filter((m) => m.ev.perfect).length;
  const common = Object.entries(all.reduce((o, e) => { o[e.why] = (o[e.why] || 0) + 1; return o; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const save = () => { if (saved) return; all.slice(0, 20).forEach((e) => addMistake(e.from, e.to, e.why)); setSaved(true); };
  return (<>
    <div className="card"><h3>Your results</h3>
      <p>🌟 You wrote or said <strong>{me.length}</strong> message(s), {me.filter((m) => m.spoken).length} by voice. Trying is what counts!</p>
      <p>{perfect} of {me.length} had no mistakes found. {all.length} possible mistake(s) in total.</p>
      {common.length > 0 && <><p><strong>Patterns to practise:</strong></p>{common.map(([w, n]) => <p key={w} className="muted">• {w} ({n}x)</p>)}</>}
      <p className="muted">These checks are rule-based. They catch common mistakes but not every error, and pronunciation tips come from the words you used and how clearly the browser understood you.</p>
      <div className="row"><button onClick={save} disabled={saved || !all.length}>{saved ? 'Saved to notebook ✓' : 'Save mistakes to notebook'}</button></div>
      <DownloadRow msgs={msgs} />
    </div>
    <div className="card chat">{msgs.map((m) => (m.from === 'ai'
      ? <div key={m.id} className="bubble ai">🦜 {m.text}</div>
      : <div key={m.id} className="bubble me wide"><div>{m.spoken ? '🎤' : '⌨️'} {m.text}</div><Fix ev={m.ev} /></div>))}</div>
  </>);
}

export default function FreeChat({ ctx }) {
  const { award, s } = ctx;
  const v = s.voice || { accent: 'en-US', style: 'w1', rate: 0.85 };
  const [msgs, setMsgs] = useState(load), [input, setInput] = useState(''), [view, setView] = useState('chat'), [live, setLive] = useState(false), [err, setErr] = useState('');
  const [read, setRead] = useState(false), [hints, setHints] = useState(false), [auto, setAuto] = useState(true), [help, setHelp] = useState(false);
  const busy = useRef(false), rec = useRef(null), heard = useRef({ text: '', conf: 0 }), timer = useRef(), st = useRef({ last: '' }), endRef = useRef();
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(msgs.slice(-200))); } catch { /* storage unavailable */ } }, [msgs]);
  useEffect(() => () => { clearTimeout(timer.current); try { rec.current && rec.current.stop(); } catch { /* ignore */ } }, []);
  useEffect(() => { if (endRef.current && endRef.current.scrollIntoView) endRef.current.scrollIntoView({ block: 'nearest' }); }, [msgs.length, view]);

  const send = (text, spoken = false, conf = 0) => {
    const t = text.trim(); if (!t || busy.current) return;
    busy.current = true; setHelp(false); setInput('');
    const ev = evaluate(t, spoken, conf), r = reply(t, st.current);
    setMsgs((p) => [...p, { id: 'u' + Date.now(), from: 'me', text: t, spoken, ev }]);
    award(4, 'freechat');
    timer.current = setTimeout(() => { setMsgs((p) => [...p, { id: 'a' + Date.now(), from: 'ai', text: r.t, sug: r.sug }]); busy.current = false; if (read) speak(r.t, v); }, 600);
  };
  const startMic = () => {
    setErr(''); stopSpeak(); heard.current = { text: '', conf: 0 }; let failed = false;
    try {
      rec.current = listen({ lang: v.accent.startsWith('en') ? v.accent : 'en-US', onText: (t, c) => { heard.current = { text: t, conf: c || 0 }; setInput(t); },
        onEnd: () => { setLive(false); const h = heard.current; if (failed) return; if (!h.text) setErr('I did not hear anything. Check your microphone with the test below, speak a little closer, and try again.'); else if (auto) send(h.text, true, h.conf); },
        onError: (e) => { failed = true; setErr(micError(e)); setLive(false); } });
      setLive(true);
    } catch { setErr(micError('start')); }
  };
  const stopMic = () => { try { rec.current && rec.current.stop(); } catch { /* ignore */ } };
  const submit = () => send(input, !!input && input === heard.current.text, heard.current.conf);
  const topic = (tp) => { const m = { id: 'a' + Date.now(), from: 'ai', text: tp.q, sug: tp.sug }; setMsgs((p) => [...p, m]); if (read) speak(tp.q, v); };
  const fresh = () => { if (!window.confirm('Start a new chat? The current chat will be cleared.')) return; clearTimeout(timer.current); busy.current = false; setMsgs([firstMessage()]); setView('chat'); setInput(''); };
  const last = msgs[msgs.length - 1], sug = last && last.from === 'ai' ? last.sug || [] : [];

  return (<>
    <VoicePicker ctx={ctx} />
    <div className="card">
      <h3>Free chat with Parrot</h3>
      <p className="muted">Chat about anything. Mistakes are fine! I only check your English in the background, and you see the corrections when you press “Show results”.</p>
      <div className="row">
        <button onClick={() => setView(view === 'chat' ? 'results' : 'chat')}>{view === 'chat' ? '📊 Show results' : '💬 Back to chat'}</button>
        <button className="ghost" onClick={fresh}>New chat</button>
        <label><input type="checkbox" checked={read} onChange={(e) => setRead(e.target.checked)} /> Read AI aloud</label>
        <label><input type="checkbox" checked={hints} onChange={(e) => setHints(e.target.checked)} /> Instant hints</label>
        <label><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Auto-send voice</label>
      </div>
      {view === 'chat' && <DownloadRow msgs={msgs} />}
    </div>
    {view === 'results' ? <Results msgs={msgs} ctx={ctx} /> : (<div className="card">
      <div className="chat tall" aria-live="polite">{msgs.map((m) => (m.from === 'ai'
        ? <div key={m.id} className="bubble ai">🦜 {m.text}</div>
        : <div key={m.id} className="bubble me wide"><div>{m.spoken ? '🎤' : '⌨️'} {m.text}</div>{hints && <Fix ev={m.ev} />}</div>))}<div ref={endRef} /></div>
      <div className="row pills">{starters.map((tp) => <button key={tp.id} className="tab" onClick={() => topic(tp)}>{tp.label}</button>)}</div>
      {help && sug.length > 0 && <div className="row">{sug.map((x) => <button key={x} className="opt" onClick={() => { setInput(x); heard.current = { text: '', conf: 0 }; }}>{x}</button>)}</div>}
      <div className="row">
        <input aria-label="Your message" value={input} placeholder={live ? 'Listening… speak now' : 'Type your message, or press the microphone'} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
        {SR ? <button className={live ? 'rec' : ''} aria-pressed={live} onClick={live ? stopMic : startMic}>{live ? '⏹ Stop' : '🎤 Speak'}</button> : null}
        <button onClick={submit} disabled={!input.trim()}>Send</button>
        <button className="ghost" onClick={() => setHelp(!help)}>💡 Help me reply</button>
      </div>
      {!SR && <p className="muted">Voice input is not available in this browser (try Chrome or Edge). Typing works everywhere.</p>}
      {err && <p className="fb no" role="alert">{err}</p>}
      <p className="muted">Press Stop when you finish speaking. I keep listening through short pauses.</p>
      <details><summary>Microphone not working? Test it</summary><MicCheck /></details>
      <p className="muted">The microphone starts only when you press it, and nothing is recorded or saved by this app. In Chrome and Edge the browser's speech recognition may send your voice to its provider. The chat is saved in this browser only.</p>
    </div>)}
  </>);
}

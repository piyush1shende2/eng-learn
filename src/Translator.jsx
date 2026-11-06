import { useEffect, useRef, useState } from 'react';
import { IFACE, LANGS, langOf } from './langs.js';
import { SR, listen, micError, stopSpeak, speak } from './speech.js';
import { translate, detectLang, loadHistory, saveHistory, addCorrection, deviceSupport, deviceAvailability, prepareDevice, keyWords } from './translate.js';
import { Actions, accentFor, exportTxt, exportDoc, printPdf } from './tshared.jsx';
import { Attempt } from './Attempt.jsx';
import ScanTranslate from './ScanTranslate.jsx';

const recLang = (l, s) => (l === 'auto' ? langOf(s.known || 'en').bcp : langOf(l).bcp);
const VIA = { phrasebook: 'offline phrasebook', correction: 'your correction', device: 'on-device translator', online: 'online translator' };

function Entry({ e, ctx, onSave, onDelete }) {
  const [edit, setEdit] = useState(false), [val, setVal] = useState(e.out);
  return (<div className={'entry ' + (e.side === 'B' ? 'right' : 'left')}>
    <p className="muted">{langOf(e.from).native} → {langOf(e.to).native} · {VIA[e.via] || e.via}{e.corrected ? ' · corrected' : ''}{e.scan ? ' · camera' : ''}</p>
    <p dir="auto" lang={langOf(e.from).bcp}>{e.src}</p>
    {edit ? <div className="row"><input dir="auto" value={val} onChange={(x) => setVal(x.target.value)} /><button onClick={() => { const v = val.trim(); if (v) { addCorrection(e.from, e.to, e.src, v); onSave({ ...e, out: v, via: 'correction', corrected: true }); } setEdit(false); }}>Save</button><button className="ghost" onClick={() => setEdit(false)}>Cancel</button></div>
      : <p className="big" dir="auto" lang={langOf(e.to).bcp}>{e.out}</p>}
    <Actions text={e.out} lang={e.to} s={ctx.s} extra={<><button className="ghost small" onClick={() => { setVal(e.out); setEdit(true); }}>✏️ Correct</button><button className="ghost small" aria-label="Delete" onClick={onDelete}>🗑</button></>} />
  </div>);
}

function LearnPanel({ e, ctx, online }) {
  const [rows, setRows] = useState([]), [mean, setMean] = useState(''), known = ctx.s.known || 'en';
  useEffect(() => {
    let off = false; setRows([]); setMean('');
    (async () => {
      const out = [];
      for (const w of keyWords(e.src, e.from)) { const r = await translate(w, e.from, e.to, { online }); if (off) return; if (r.text) out.push([w, r.text]); }
      if (!off) setRows(out);
      if (known !== e.to && known !== e.from) { const m = await translate(e.out, e.to, known, { online }); if (!off && m.text) setMean(m.text); }
    })();
    return () => { off = true; };
  }, [e.id]);
  const to = e.to === 'hing' ? 'hi' : e.to, ctx2 = { ...ctx, s: { ...ctx.s, target: to, voice: { ...ctx.s.voice, accent: accentFor(to, ctx.s) } } };
  return (<div className="card"><h4>📘 Learning mode</h4>
    {rows.length > 0 ? <>{rows.map(([a, b]) => <p key={a}><strong dir="auto">{a}</strong> → <span dir="auto">{b}</span></p>)}</> : <p className="muted">Looking for key words…</p>}
    {mean && <p className="muted">In {langOf(known).native}: <span dir="auto">{mean}</span></p>}
    <details><summary>🎤 Practise saying the translation</summary><Attempt key={e.id} variants={e.out} ctx={ctx2} /></details>
  </div>);
}

function Engine({ src, dst, online, setOnline, s }) {
  const from = src === 'auto' ? s.known || 'en' : src;
  const [av, setAv] = useState('checking'), [pct, setPct] = useState(0), [msg, setMsg] = useState('');
  useEffect(() => { let off = false; setAv('checking'); deviceAvailability(from, dst).then((a) => !off && setAv(a)); return () => { off = true; }; }, [from, dst]);
  const dl = async () => { setMsg(''); setAv('downloading'); try { await prepareDevice(from, dst, (p) => setPct(Math.round(p * 100))); setAv('available'); } catch (e) { setAv('downloadable'); setMsg('Could not download the language pack: ' + ((e && e.message) || 'unknown error')); } };
  return (<div className="card"><h4>Translation engine</h4>
    <p>{!deviceSupport() ? 'This browser has no on-device translator (Chrome 138+ on desktop has one). The online translator and the offline phrasebook are used instead.'
      : av === 'available' ? '✓ On-device translation is ready for this language pair and works offline.'
      : av === 'downloadable' ? 'An offline language pack can be downloaded for this pair.'
      : av === 'downloading' ? `Downloading the language pack… ${pct}%` : av === 'checking' ? 'Checking…' : 'This language pair is not available on this device.'}</p>
    {deviceSupport() && av === 'downloadable' && <button onClick={dl}>⬇ Download offline pack</button>}{msg && <p className="fb no" role="alert">{msg}</p>}
    <label><input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} /> Allow online translation (sends the text to the free MyMemory service when no offline engine can translate it)</label>
    <p className="muted">Always offline: the 14-phrase phrasebook and your saved corrections. Translations can be wrong, so use the ✏️ Correct button to fix one; the app remembers your correction.</p>
  </div>);
}

export default function TranslatorTab({ ctx }) {
  const { s, award } = ctx, known = s.known || 'en';
  const [mode, setMode] = useState('solo'), [src, setSrc] = useState(known), [dst, setDst] = useState(() => (s.target && s.target !== known ? s.target : known === 'en' ? 'hi' : 'en'));
  const [hist, setHist] = useState(loadHistory), [online, setOnline] = useState(true), [autoPlay, setAutoPlay] = useState(true), [learn, setLearn] = useState(true), [live, setLive] = useState(false);
  const [input, setInput] = useState(''), [interim, setInterim] = useState(''), [liveOut, setLiveOut] = useState(''), [busy, setBusy] = useState(false), [err, setErr] = useState(''), [listening, setListening] = useState('');
  const rec = useRef(null), debounce = useRef(), busyRef = useRef(false), lastLive = useRef('');
  useEffect(() => { saveHistory(hist); }, [hist]);
  useEffect(() => () => { clearTimeout(debounce.current); try { rec.current && rec.current.stop(); } catch { /* ignore */ } }, []);
  const cur = hist.length ? hist[hist.length - 1] : null;
  const push = (e) => setHist((h) => [...h, e]);

  const run = async (text, from, to, side) => {
    const t = text.trim(); if (!t || busyRef.current) return;
    busyRef.current = true; setBusy(true); setErr('');
    let f = from;
    if (f === 'auto') { const d = await detectLang(t); f = d.lang; }
    const r = await translate(t, f, to, { online });
    busyRef.current = false; setBusy(false);
    if (!r.text) { setErr(r.error || 'No translation engine is available.'); return; }
    const e = { id: Date.now() + '-' + Math.random().toString(36).slice(2, 6), from: f, to, src: t, out: r.text, via: r.via, side, at: Date.now() };
    push(e); award(3, 'translate'); setInput(''); setLiveOut('');
    if (autoPlay) speak(r.text, { accent: accentFor(to, s), rate: s.voice ? s.voice.rate : 0.85 });
  };
  const scheduleLive = (t, from, to) => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      if (t.length - lastLive.current.length < 6 && t.length > 6) return;
      const f = from === 'auto' ? known : from; lastLive.current = t;
      const r = await translate(t, f, to, { online }); if (r.text) setLiveOut(r.text);
    }, 700);
  };
  const startMic = (side) => {
    stopSpeak(); setErr(''); setInterim(''); setLiveOut(''); lastLive.current = '';
    const from = side === 'A' ? src : dst, to = side === 'A' ? dst : src;
    let heard = '', failed = false;
    try {
      rec.current = listen({ lang: recLang(from, s), onText: (t) => { heard = t; setInterim(t); if (live) scheduleLive(t, from, to); },
        onEnd: () => { setListening(''); setInterim(''); if (!failed && heard) run(heard, from, to, side); else if (!failed) setErr('I did not hear anything. Check your microphone and try again.'); },
        onError: (e) => { failed = true; setErr(micError(e)); setListening(''); } });
      setListening(side);
    } catch { setErr(micError('start')); }
  };
  const stopMic = () => { try { rec.current && rec.current.stop(); } catch { /* ignore */ } };
  const swap = () => { if (src === 'auto') return; setSrc(dst); setDst(src); };
  const mic = (side, label) => <button className={listening === side ? 'rec' : ''} onClick={listening === side ? stopMic : () => startMic(side)} disabled={!SR || (!!listening && listening !== side)}>{listening === side ? '⏹ Stop' : '🎤 ' + label}</button>;
  const L = (id) => (id === 'auto' ? 'Detect language' : langOf(id).native + ' (' + langOf(id).name + ')');

  return (<>
    <div className="card"><h3>Translator</h3>
      <div className="row">
        <label>From <select value={src} onChange={(e) => setSrc(e.target.value)}><option value="auto">Detect language (typed text and photos)</option>{IFACE.map((l) => <option key={l.id} value={l.id}>{l.native} ({l.name}{l.id === 'hing' ? ', mixed Hindi + English' : ''})</option>)}</select></label>
        <button className="ghost" onClick={swap} disabled={src === 'auto'} aria-label="Swap languages">⇄ Swap</button>
        <label>To <select value={dst} onChange={(e) => setDst(e.target.value)}>{LANGS.map((l) => <option key={l.id} value={l.id}>{l.native} ({l.name})</option>)}</select></label>
      </div>
      <div className="row pills">{[['solo', 'Speak or type'], ['duo', 'Two-way conversation'], ['scan', 'Camera, photos, video']].map(([k, n]) => <button key={k} className={mode === k ? 'tab on' : 'tab'} onClick={() => setMode(k)}>{n}</button>)}</div>
      <div className="row"><label><input type="checkbox" checked={autoPlay} onChange={(e) => setAutoPlay(e.target.checked)} /> Read translation aloud</label><label><input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} /> Translate while I speak</label><label><input type="checkbox" checked={learn} onChange={(e) => setLearn(e.target.checked)} /> Learning mode</label></div>
      {src === 'auto' && <p className="muted">Spoken language cannot be detected by the browser. For speech, the language you know ({langOf(known).name}) is used; for typed text and photos the language is detected.</p>}
      {!SR && <p className="muted">Voice input is not available in this browser (try Chrome or Edge). Typing and photos still work.</p>}
    </div>
    <Engine src={src} dst={dst} online={online} setOnline={setOnline} s={s} />
    {mode === 'solo' && <div className="card">
      <div className="row"><textarea dir="auto" rows={3} aria-label="Text to translate" value={listening ? interim : input} readOnly={!!listening} placeholder="Type here, or press the microphone and speak" onChange={(e) => setInput(e.target.value)} /></div>
      <div className="row">{mic('A', `Speak (${src === 'auto' ? langOf(known).name : langOf(src).name})`)}<button onClick={() => run(input, src, dst, 'A')} disabled={busy || !input.trim() || !!listening}>{busy ? 'Translating…' : 'Translate'}</button><button className="ghost" onClick={() => setInput('')}>Clear text</button></div>
      {listening && live && liveOut && <p className="muted" dir="auto">Live translation: {liveOut}</p>}
      {err && <p className="fb no" role="alert">{err}</p>}
      <p className="muted">Press Stop when you finish speaking; I keep listening through short pauses. The microphone starts only when you press it, and this app does not record audio. In Chrome and Edge the browser's speech recognition may send your voice to its provider.</p>
    </div>}
    {mode === 'duo' && <div className="card"><h4>Two-way conversation</h4>
      <p className="muted">Each person speaks in their own language and hears the other language back.</p>
      <div className="row">{mic('A', `Person A speaks (${langOf(src === 'auto' ? known : src).name})`)}{mic('B', `Person B speaks (${langOf(dst).name})`)}</div>
      {listening && <p dir="auto" role="status">{interim || 'Listening…'}</p>}
      <div className="row"><input dir="auto" aria-label="Type a message" value={input} placeholder="Or type a message" onChange={(e) => setInput(e.target.value)} /><button onClick={() => run(input, src, dst, 'A')} disabled={busy || !input.trim()}>Send as A</button><button onClick={() => run(input, dst, src === 'auto' ? known : src, 'B')} disabled={busy || !input.trim()}>Send as B</button></div>
      {err && <p className="fb no" role="alert">{err}</p>}</div>}
    {mode === 'scan' && <ScanTranslate ctx={ctx} src={src} dst={dst} online={online} push={push} />}
    {learn && cur && mode !== 'scan' && <LearnPanel key={cur.id} e={cur} ctx={ctx} online={online} />}
    <div className="card"><h4>History ({hist.length})</h4>
      <div className="row"><button className="ghost" onClick={() => exportTxt(hist)} disabled={!hist.length}>Download text</button><button className="ghost" onClick={() => exportDoc(hist)} disabled={!hist.length}>Download Word</button><button className="ghost" onClick={() => printPdf(hist)} disabled={!hist.length}>Print / Save as PDF</button><button className="ghost" onClick={() => window.confirm('Clear all saved translations? Your corrections are kept.') && setHist([])} disabled={!hist.length}>Clear</button></div>
      {!hist.length && <p className="muted">Nothing translated yet.</p>}
      <div className="hist">{(mode === 'duo' ? hist : [...hist].reverse()).map((e) => <Entry key={e.id} e={e} ctx={ctx} onSave={(n) => setHist((h) => h.map((x) => (x.id === n.id ? n : x)))} onDelete={() => setHist((h) => h.filter((x) => x.id !== e.id))} />)}</div>
      <p className="muted">History is saved in this browser only.</p>
    </div>
  </>);
}

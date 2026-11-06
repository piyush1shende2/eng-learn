import { useEffect, useRef, useState } from 'react';
import { speak } from './speech.js';

// Record yourself and listen to the reference voice and your recording one after the other.
// You compare by ear; there is no score. The recording stays in this page and is never uploaded.
export default function RecordCompare({ text, accent, rate, refUrl }) {
  const [on, setOn] = useState(false), [url, setUrl] = useState(''), [err, setErr] = useState('');
  const mr = useRef(null), audio = useRef(), timer = useRef();
  useEffect(() => () => { clearTimeout(timer.current); try { mr.current && mr.current.state === 'recording' && mr.current.stop(); } catch { /* ignore */ } }, []);
  const clear = () => { if (url) URL.revokeObjectURL(url); setUrl(''); };
  const start = async () => {
    setErr(''); clear();
    if (!navigator.mediaDevices || typeof MediaRecorder === 'undefined') { setErr('Recording is not available in this browser.'); return; }
    try {
      const st = await navigator.mediaDevices.getUserMedia({ audio: true }), chunks = [], r = new MediaRecorder(st);
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      r.onstop = () => { st.getTracks().forEach((t) => t.stop()); setUrl(URL.createObjectURL(new Blob(chunks, { type: r.mimeType || 'audio/webm' }))); setOn(false); };
      mr.current = r; r.start(); setOn(true); timer.current = setTimeout(() => r.state === 'recording' && r.stop(), 15000);
    } catch { setErr('The microphone is blocked or unavailable. Allow it in the address bar and try again.'); }
  };
  const stop = () => { try { mr.current && mr.current.stop(); } catch { /* ignore */ } };
  return (<div className="micbox"><h4>Compare with the reference</h4>
    <div className="row"><button className="ghost" onClick={on ? stop : start}>{on ? '⏹ Stop recording' : '🎙 Record myself (max 15 s)'}</button>
      {url && <><button onClick={() => { const me = () => audio.current && audio.current.play(); if (refUrl) { const ref = new Audio(refUrl); ref.onended = me; ref.play().catch(me); } else speak(text, { accent, rate, variety: false, onEnd: me }); }}>▶ Reference, then me</button><button className="ghost" onClick={clear}>Delete recording</button></>}</div>
    {url && <audio ref={audio} src={url} controls />}
    {err && <p className="fb no" role="alert">{err}</p>}
    <p className="muted">Listen to both and compare the sounds and rhythm. This does not give a score, and nothing is uploaded or saved.</p></div>);
}

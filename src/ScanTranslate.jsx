import { useEffect, useRef, useState } from 'react';
import { langOf } from './langs.js';
import { translate } from './translate.js';
import { readText, stopOcr } from './ocr.js';
import { Actions } from './tshared.jsx';

// Camera, photo and video translation. Text is read in the browser (OCR) and then translated.
// Printed text works best; handwriting and curved or blurry text are often misread.
export default function ScanTranslate({ ctx, src, dst, online, push }) {
  const { s, award } = ctx, lang = src === 'auto' ? 'en' : src;
  const [cam, setCam] = useState(false), [auto, setAuto] = useState(false), [busy, setBusy] = useState(false), [prog, setProg] = useState(''), [err, setErr] = useState('');
  const [text, setText] = useState(''), [out, setOut] = useState(''), [media, setMedia] = useState(null);
  const vid = useRef(), stream = useRef(), prev = useRef(''), busyRef = useRef(false);

  const stopCam = () => { if (stream.current) stream.current.getTracks().forEach((t) => t.stop()); stream.current = null; setCam(false); setAuto(false); };
  useEffect(() => () => { stopCam(); stopOcr(); }, []);
  useEffect(() => { const v = vid.current; if (!v) return; if (cam && stream.current) { v.srcObject = stream.current; v.play().catch(() => {}); } else v.srcObject = null; }, [cam, media]);
  const startCam = async () => {
    setErr(''); setMedia(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setErr('The camera needs a secure page. Open the app at http://localhost:5173 in Chrome or Edge.'); return; }
    try { stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }); setCam(true); }
    catch (e) { setErr(e && e.name === 'NotFoundError' ? 'No camera was found.' : 'The camera is blocked. Click the lock icon in the address bar, allow the camera, and try again.'); }
  };
  const norm = (t) => t.toLowerCase().replace(/\s+/g, ' ').trim();
  const tr = async (t) => {
    const r = await translate(t, lang, dst, { online });
    if (!r.text) { setErr(r.error || 'No translation engine is available.'); return; }
    setOut(r.text); setErr('');
    push({ id: Date.now() + '-s' + Math.random().toString(36).slice(2, 5), from: lang, to: dst, src: t, out: r.text, via: r.via, side: 'A', at: Date.now(), scan: true }); award(5, 'scan');
  };
  const scan = async (source, silent) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setErr(''); setProg('Reading text…');
    try {
      const r = await readText(source, lang, (m) => m && m.status && setProg(m.status + (m.progress ? ' ' + Math.round(m.progress * 100) + '%' : '')));
      if (!r.text) { if (!silent) setErr('I could not find readable text. Use good light, hold steady, and fill the frame with the text.'); }
      else if (!silent || norm(r.text) !== prev.current) { prev.current = norm(r.text); setText(r.text); await tr(r.text); }
    } catch { setErr('Text recognition could not start. The first use needs internet to download the language data (see the README for offline hosting).'); }
    busyRef.current = false; setBusy(false); setProg('');
  };
  const capture = () => {
    const v = vid.current;
    if (!v || !v.videoWidth) { setErr('The video is not ready yet.'); return null; }
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0); return c;
  };
  useEffect(() => {
    if (!auto || !cam) return undefined;
    const id = setInterval(() => { const c = capture(); if (c) scan(c, true); }, 4500);
    return () => clearInterval(id);
  }, [auto, cam, lang, dst, online]);
  const onFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    stopCam(); setErr(''); setOut(''); setText(''); if (media) URL.revokeObjectURL(media.url);
    const kind = f.type.startsWith('video') ? 'video' : 'image';
    setMedia({ kind, url: URL.createObjectURL(f) }); if (kind === 'image') scan(f);
    e.target.value = '';
  };
  return (<div className="card"><h3>Camera, photos and video</h3>
    <p className="muted">Reading text in: <strong>{langOf(lang).name}</strong> → translating to <strong>{langOf(dst).name}</strong>. {src === 'auto' ? 'Pick the language of the text in the first drop-down for other scripts.' : ''}</p>
    <div className="row">
      <button onClick={cam ? stopCam : startCam}>{cam ? '⏹ Stop camera' : '📷 Start camera'}</button>
      {(cam || (media && media.kind === 'video')) && <button onClick={() => { const c = capture(); if (c) scan(c); }} disabled={busy}>📸 Scan this frame</button>}
      {cam && <label><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Auto-scan every few seconds</label>}
      <label className="filebtn">📁 Choose a photo or video<input type="file" accept="image/*,video/*" onChange={onFile} hidden /></label>
    </div>
    {(cam || (media && media.kind === 'video')) && <video ref={vid} className="preview" src={!cam && media ? media.url : undefined} controls={!cam} muted playsInline />}
    {media && media.kind === 'image' && <img className="preview" src={media.url} alt="Chosen photo" />}
    {busy && <p role="status">⏳ {prog}</p>}
    {err && <p className="fb no" role="alert">{err}</p>}
    {text && <><p className="muted">Text found (edit it if it was misread):</p><textarea dir="auto" rows={3} value={text} onChange={(e) => setText(e.target.value)} /><div className="row"><button onClick={async () => { setBusy(true); await tr(text); setBusy(false); }} disabled={busy}>Translate again</button></div></>}
    {out && <><p className="muted">Translation:</p><p className="big" dir="auto" lang={langOf(dst).bcp}>{out}</p><Actions text={out} lang={dst} s={s} /></>}
    <p className="muted">Photos and video frames stay on your device: text recognition runs in your browser, and the camera starts only when you press the button. The recognised text may be sent to the online translator if online translation is allowed. Printed text works best.</p>
  </div>);
}

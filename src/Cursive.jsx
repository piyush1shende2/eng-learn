import { useEffect, useRef, useState } from 'react';
import { LANGS, STYLES, SCRIPT, setsFor, writeWords, langOf } from './langs.js';
import { speak } from './speech.js';

const W = 520, H = 200;
const SHAPES = {
  circle: (g) => g.arc(W / 2, H / 2, 70, 0, Math.PI * 2),
  square: (g) => g.rect(W / 2 - 65, H / 2 - 65, 130, 130),
  triangle: (g) => { g.moveTo(W / 2, 25); g.lineTo(W / 2 + 80, 170); g.lineTo(W / 2 - 80, 170); g.closePath(); },
  heart: (g) => { g.moveTo(W / 2, 170); g.bezierCurveTo(W / 2 - 110, 100, W / 2 - 60, 20, W / 2, 75); g.bezierCurveTo(W / 2 + 60, 20, W / 2 + 110, 100, W / 2, 170); },
  star: (g) => { for (let k = 0; k < 10; k++) { const r = k % 2 ? 38 : 80, a = -Math.PI / 2 + (k * Math.PI) / 5; g[k ? 'lineTo' : 'moveTo'](W / 2 + r * Math.cos(a), H / 2 + 8 + r * Math.sin(a)); } g.closePath(); },
};
const font = (st, px) => `${st.i ? 'italic ' : ''}${st.b ? 'bold ' : ''}${px}px ${st.fam}`;
const THR = { set: 45, word: 60, shape: 50 };

// Practise writing in many scripts and handwriting styles. The check measures how closely you traced
// the guide; it is not handwriting recognition. Fonts come from your device.
export default function Cursive({ ctx: { s, award, t } }) {
  const known = s.known || 'en';
  const [wl, setWl] = useState(s.target || 'en'), [si, setSi] = useState(0), [kind, setKind] = useState('set'), [seti, setSeti] = useState(0), [i, setI] = useState(0), [score, setScore] = useState(null);
  const guide = useRef(), draw = useRef(), down = useRef(false), awarded = useRef(false);
  const styles = STYLES[SCRIPT[wl]], style = styles[si % styles.length], lang = langOf(wl);
  const sets = setsFor(wl), set = sets[seti % sets.length], words = writeWords(wl, known);
  let text = '', note = '';
  if (kind === 'set') { const it = set.items[i % set.items.length]; text = it[0]; note = it[1]; }
  else if (kind === 'word' || kind === 'free') { const it = words[i % words.length]; text = style.up ? it[0].toUpperCase() : it[0]; note = it[1]; }
  else { const keys = Object.keys(SHAPES); text = keys[i % keys.length]; }

  useEffect(() => {
    const g = guide.current.getContext('2d');
    g.clearRect(0, 0, W, H); g.setLineDash([]); g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = lang.rtl ? 'rtl' : 'ltr';
    if (kind === 'free') { g.strokeStyle = '#cfe6d8'; g.lineWidth = 2; [60, 110, 160].forEach((y) => { g.beginPath(); g.moveTo(20, y); g.lineTo(W - 20, y); g.stroke(); }); }
    else if (kind === 'word') {
      let px = 110; g.font = font(style, px); while (px > 36 && g.measureText(text).width > W - 40) { px -= 6; g.font = font(style, px); }
      g.fillStyle = '#b9d9c6'; g.fillText(text, W / 2, H / 2);
    } else {
      g.strokeStyle = '#b9d9c6'; g.lineWidth = 16; g.lineJoin = 'round';
      if (kind === 'set') { g.font = font(style, 150); g.strokeText(text, W / 2, H / 2 + 8); } else { g.beginPath(); SHAPES[text](g); g.stroke(); }
    }
    draw.current.getContext('2d').clearRect(0, 0, W, H); setScore(null); awarded.current = false;
  }, [wl, si, kind, seti, i]);

  const pos = (e) => { const r = draw.current.getBoundingClientRect(); return [((e.clientX - r.left) * W) / r.width, ((e.clientY - r.top) * H) / r.height]; };
  const start = (e) => { down.current = true; draw.current.setPointerCapture(e.pointerId); const c = draw.current.getContext('2d'); c.lineWidth = 10; c.lineCap = c.lineJoin = 'round'; c.strokeStyle = '#3f5b4e'; c.beginPath(); c.moveTo(...pos(e)); };
  const move = (e) => { if (!down.current) return; const c = draw.current.getContext('2d'); c.lineTo(...pos(e)); c.stroke(); };
  const check = () => {
    const gd = guide.current.getContext('2d').getImageData(0, 0, W, H).data, ud = draw.current.getContext('2d').getImageData(0, 0, W, H).data;
    let total = 0, hit = 0;
    for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) { const p = (y * W + x) * 4 + 3; if (gd[p] > 100) { total++; if (ud[p] > 100) hit++; } }
    const pct = total ? Math.round((hit / total) * 100) : 0; setScore(pct);
    if (pct >= THR[kind] && !awarded.current) { awarded.current = true; award(12, 'cursive'); }
  };
  const saveImg = () => {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.drawImage(guide.current, 0, 0); g.drawImage(draw.current, 0, 0);
    c.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'my-writing.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500); });
  };
  const accent = wl === (s.target || 'en') && s.voice ? s.voice.accent : LANGS.find((l) => l.id === wl).bcp;
  const refresh = (fn) => (e) => { fn(e.target.value); setI(0); setSeti(0); };

  return (<div className="card">
    <h3>Writing practice</h3>
    <div className="row">
      <label>Language <select value={wl} onChange={(e) => { setWl(e.target.value); setSi(0); setSeti(0); setI(0); }}>{LANGS.map((l) => <option key={l.id} value={l.id}>{l.native} ({l.name})</option>)}</select></label>
      <label>Handwriting style <select value={si % styles.length} onChange={(e) => setSi(+e.target.value)}>{styles.map((x, k) => <option key={x.id} value={k}>{x.label}</option>)}</select></label>
      {kind === 'set' && sets.length > 1 && <label>Set <select value={seti % sets.length} onChange={refresh((v) => setSeti(+v))}>{sets.map((x, k) => <option key={x.id} value={k}>{x.label}</option>)}</select></label>}
    </div>
    <div className="row pills">{[['set', 'Letters / characters'], ['word', 'Words'], ['shape', 'Shapes'], ['free', 'Free writing']].map(([k, n]) => <button key={k} className={kind === k ? 'tab on' : 'tab'} onClick={() => { setKind(k); setI(0); }}>{n}</button>)}</div>
    <p className="muted">{kind === 'free' ? 'Copy the word below onto the lines, in your own handwriting.' : 'Trace the light shape with your mouse, finger or stylus.'}</p>
    {(kind === 'free' || kind === 'word') && <p className="big" lang={lang.bcp} style={{ fontFamily: style.fam, fontStyle: style.i ? 'italic' : 'normal', fontWeight: style.b ? 700 : 400 }}>{text}</p>}
    {kind !== 'shape' && <p className="muted">{note}{kind === 'word' && wl !== known ? '' : ''} <button className="ghost small" aria-label="Hear it" onClick={() => speak(text, { accent })}>🔊</button></p>}
    <div className="canvasbox">
      <canvas ref={guide} width={W} height={H} aria-hidden="true" />
      <canvas ref={draw} width={W} height={H} aria-label="Drawing area" style={{ touchAction: 'none' }} onPointerDown={start} onPointerMove={move} onPointerUp={() => (down.current = false)} onPointerLeave={() => (down.current = false)} />
    </div>
    <div className="row">{kind !== 'free' && <button onClick={check}>{t.check}</button>}<button className="ghost" onClick={() => { draw.current.getContext('2d').clearRect(0, 0, W, H); setScore(null); }}>Clear</button><button className="ghost" onClick={() => setI(i + 1)}>{t.next}</button><button className="ghost" onClick={saveImg}>Save image</button></div>
    {score != null && <p className={`fb ${score >= THR[kind] ? 'ok' : 'no'}`} role="status">Tracing coverage: {score}%. {score >= THR[kind] ? t.great : 'Try following the line more closely.'}</p>}
    <p className="muted">Styles use fonts installed on your device. If two styles look the same, that font is not installed. Complex characters are traced as outlines.</p>
  </div>);
}

import { useState } from 'react';
import { speak } from './speech.js';
import { accentsFor, langOf } from './langs.js';
import { save } from './exporters.js';

export const accentFor = (lang, s) => { const l = lang === 'hing' ? 'hi' : lang; return l === (s.target || 'en') && s.voice && s.voice.accent ? s.voice.accent : accentsFor(l)[0][0]; };
export async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch { /* fall back */ }
  try { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); const ok = document.execCommand('copy'); a.remove(); return ok; } catch { return false; }
}
export function Actions({ text, lang, s, extra }) {
  const [m, setM] = useState('');
  const say = (rate) => speak(text, { accent: accentFor(lang, s), rate, variety: false });
  const copy = async () => { setM((await copyText(text)) ? 'Copied ✓' : 'Could not copy'); setTimeout(() => setM(''), 2000); };
  const share = async () => { if (navigator.share) { try { await navigator.share({ text }); return; } catch { /* cancelled */ } } copy(); };
  return (<div className="row">
    <button className="ghost small" onClick={() => say(s.voice ? s.voice.rate : 0.85)}>▶ Play</button><button className="ghost small" onClick={() => say(0.5)}>🐢 Slow</button>
    <button className="ghost small" onClick={copy}>📋 Copy</button><button className="ghost small" onClick={share}>📤 Share</button>{extra}{m && <span className="muted" role="status">{m}</span>}
  </div>);
}
const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const html = (h) => `<html><head><meta charset="utf-8"><title>SpeakWise AI translations</title></head><body style="font-family:'Segoe UI',Arial,'Noto Sans',sans-serif"><h1>SpeakWise AI - Translation transcript</h1><p>${esc(new Date().toLocaleString())}</p>${h.map((e) => `<p><b>${esc(langOf(e.from).name)} → ${esc(langOf(e.to).name)}</b><br/>${esc(e.src)}<br/><b>${esc(e.out)}</b></p>`).join('')}</body></html>`;
export const exportTxt = (h) => save(new Blob([h.map((e) => `${langOf(e.from).name} -> ${langOf(e.to).name}\n${e.src}\n${e.out}\n`).join('\n')], { type: 'text/plain;charset=utf-8' }), 'speakwise-translations.txt');
export const exportDoc = (h) => save(new Blob([html(h)], { type: 'application/msword;charset=utf-8' }), 'speakwise-translations.doc');
// "Save as PDF" through the browser's print dialog, so every script (Hindi, Japanese, Arabic...) is drawn correctly.
export function printPdf(h) {
  const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(f);
  const d = f.contentWindow.document; d.open(); d.write(html(h)); d.close();
  setTimeout(() => { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => f.remove(), 2000); }, 300);
}

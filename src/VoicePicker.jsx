import { useEffect, useState } from 'react';
import { STYLES, voicesFor, speak, setCurrent, canSpeak, beep, pickVoice, listVoices } from './speech.js';
import { accentsFor, phraseSet } from './langs.js';

export default function VoicePicker({ ctx: { s, set } }) {
  const tg = s.target || 'en', accs = accentsFor(tg);
  const v = s.voice || { accent: 'en-US', style: 'w1', rate: 0.85, variety: true };
  const acc = accs.some((a) => a[0] === v.accent) ? v.accent : accs[0][0];
  const [n, setN] = useState(0);
  const upd = (p) => { const nv = { ...v, accent: acc, ...p }; set({ voice: nv }); setCurrent(nv); };
  useEffect(() => { setN(voicesFor(acc).length); }, [acc]);
  if (!canSpeak) return <p className="fb no">This browser has no text-to-speech voices, so the AI cannot speak here. You can still read, type and practise.</p>;
  const grp = (g, label) => <optgroup label={label}>{STYLES.filter((x) => x.g === g).map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</optgroup>;
  const sample = tg === 'en' ? 'Hello! This is how I sound. How are you today?' : phraseSet(tg).slice(0, 2).join(' ');
  return (<div className="card picker">
    <div className="row">
      <label>Accent <select value={acc} onChange={(e) => upd({ accent: e.target.value })}>{accs.map((a) => <option key={a[0]} value={a[0]}>{a[1]}</option>)}</select></label>
      <label>Voice <select value={v.style} onChange={(e) => upd({ style: e.target.value })}>{grp('f', 'Women')}{grp('m', 'Men')}{grp('k', 'Kids')}</select></label>
      <label>Speed {v.rate.toFixed(2)}x <input type="range" min="0.5" max="1.3" step="0.05" value={v.rate} onChange={(e) => upd({ rate: +e.target.value })} /></label>
      <label><input type="checkbox" checked={v.variety !== false} onChange={(e) => upd({ variety: e.target.checked })} /> Natural variety</label>
      <button className="ghost" onClick={() => { setN(voicesFor(acc).length); speak(sample, { ...v, accent: acc }); }}>🔊 Hear sample</button>
    </div>
    {(() => { const rv = pickVoice(acc, v.style); return rv.voice ? <p role="status">{rv.exact ? '✓' : '⚠'} Using voice: <strong>{rv.voice.name}</strong> ({rv.voice.lang}). {rv.exact ? 'It matches this region.' : 'No voice exists for exactly this region on this device, so a voice of the same language is used. Different regions may sound identical.'}</p> : <p className="fb no">No voice was found for this language on this device.</p>; })()}
    <p className="muted">{n ? `${n} voice(s) found on this device for this accent.` : 'No voice for this accent was found on this device, so a default voice is used.'} Natural variety changes pitch and pace slightly each time, lets questions rise and statements fall, and gives each chat scene its own speaker. Voices come from your browser and operating system; kid voices are higher-pitched adult voices, and some voices ignore pitch.</p>
    <details><summary>🔎 Voice finder and how to get more accents</summary>
      <p className="muted">{listVoices().length} voice(s) installed: {Object.entries(listVoices().reduce((o, x) => { (o[x.lang] = o[x.lang] || []).push(x.name); return o; }, {})).map(([k, names]) => `${k} (${names.length})`).join(', ') || 'none detected yet'}</p>
      <ul>
        <li><strong>Microsoft Edge</strong> offers many natural online voices for real regional accents (for example en-GB, en-AU, en-IN, en-IE, en-ZA, es-MX, fr-CA, pt-PT). They need internet.</li>
        <li><strong>Windows:</strong> Settings → Time &amp; language → Speech → Manage voices → Add voices.</li>
        <li><strong>macOS:</strong> System Settings → Accessibility → Spoken Content → System voice → Manage voices.</li>
        <li><strong>Android:</strong> Settings → Text-to-speech output → install voice data.</li>
      </ul>
      <p className="muted">The app cannot create accents the device does not have. If two regions sound the same, install a voice for that region or use Edge.</p>
    </details>
    <details><summary>🎥 Presenting on Google Meet and the audience cannot hear the AI voice?</summary>
      <p><strong>Why:</strong> the AI voice is your computer's text-to-speech. It plays through the system sound, not through the browser tab, so "Present a tab" only shares the tab's own sounds (beeps and chimes) and not the voice.</p>
      <ol>
        <li><strong>Windows or ChromeOS (Chrome/Edge):</strong> Present now → <em>Your entire screen</em> → tick <em>Also share system audio</em> → Share. Window sharing cannot send audio, and neither can a Mac screen share.</li>
        <li><strong>Mac, or no checkbox:</strong> use a virtual audio cable (VB-Cable on Windows, BlackHole on Mac) so the system sound reaches the call.</li>
        <li><strong>Always works:</strong> switch on <em>Captions for audience</em> in the top bar. The words the AI speaks appear in large text on the shared screen.</li>
      </ol>
      <div className="row"><button className="ghost" onClick={() => { beep(); setTimeout(() => speak('Can you hear my voice?', { ...v, accent: 'en-US' }), 700); }}>🔊 Run presenting test</button></div>
      <p className="muted">Ask your audience: did they hear the beep, the voice, or both? Beep only means the voice is not being shared yet.</p>
    </details>
  </div>);
}

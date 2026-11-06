import { useMemo, useRef, useState } from 'react';
import { SENT, PARA, HARD } from './data3.js';
import { speak, stopSpeak, tokenize, canSpeak } from './speech.js';
import { phraseSet, langOf } from './langs.js';
import { translate } from './translate.js';
import { Karaoke, Attempt } from './Attempt.jsx';
import { useVoices } from './voices.js';
import { ClipPlayer } from './VoiceLibrary.jsx';
import VoicePicker from './VoicePicker.jsx';

// The AI reads the text aloud and the words light up as they are spoken.
export function Narrate({ text, ctx: { s } }) {
  const lang = s.target || 'en', tk = tokenize(text, lang), [pos, setPos] = useState(-1), [on, setOn] = useState(false);
  const offs = useMemo(() => { let i = 0; return tk.map((w) => { i = Math.max(0, text.indexOf(w, i)); const o = i; i += w.length; return o; }); }, [text, lang]);
  const timer = useRef(), got = useRef(false);
  const stop = () => { stopSpeak(); clearInterval(timer.current); setOn(false); };
  const rate = s.voice ? s.voice.rate : 0.85;
  const play = () => {
    stop(); setPos(0); setOn(true); got.current = false;
    speak(text, { rate, onBoundary: (ci) => { got.current = true; setPos(Math.max(0, offs.filter((o) => o <= ci).length - 1)); },
      onEnd: () => { clearInterval(timer.current); setPos(tk.length); setOn(false); } });
    setTimeout(() => { if (!got.current) { clearInterval(timer.current); timer.current = setInterval(() => setPos((p) => Math.min(p + 1, tk.length)), 420 / rate); } }, 700); // fallback when the voice gives no word events
  };
  return (<div>
    <Karaoke tokens={tk} st={tk.map((_, i) => (i < pos ? 'ok' : null))} pos={on ? pos : -1} />
    <div className="row"><button onClick={on ? stop : play}>{on ? '⏹ Stop' : '🔊 Play'}</button></div>
  </div>);
}

function Meaning({ text, kn }) {
  const [m, setM] = useState(''), [busy, setBusy] = useState(false);
  return (<div><button className="ghost small" disabled={busy} onClick={async () => { setBusy(true); const r = await translate(text, 'en', kn); setM(r.text || r.error || ''); setBusy(false); }}>🌐 Meaning in {langOf(kn).native}</button>{m && <p className="muted" dir="auto" lang={langOf(kn).bcp}>{m}</p>}</div>);
}

export default function Speak({ ctx }) {
  const { s } = ctx, tg = s.target || 'en', kn = s.known || 'en', isEn = tg === 'en';
  const man = useVoices(), real = man && man.libraries.find((l) => l.lang === tg);
  const LEVELS = isEn ? { sentence: ['Sentences', SENT], paragraph: ['Paragraphs', PARA], word: ['Complex words', HARD] } : { phrase: ['Phrases', phraseSet(tg)], ...(real ? { real: ['Real speaker', real.clips] } : {}) };
  const [lv0, setLv] = useState('sentence'), [i, setI] = useState(0), [who, setWho] = useState(null);
  const lv = LEVELS[lv0] ? lv0 : Object.keys(LEVELS)[0];
  const items = LEVELS[lv][1], idx = i % items.length, item = items[idx], text = lv === 'word' ? item.w : lv === 'real' ? item.text : item;
  const go = (d) => { stopSpeak(); setI((i + d + items.length) % items.length); setWho(null); };
  const meaning = !isEn && kn !== tg && lv === 'phrase' ? phraseSet(kn)[idx] : '';
  return (<>
    <VoicePicker ctx={ctx} />
    <div className="card">
      <h3>Speaking practice{isEn ? '' : ': ' + langOf(tg).name}</h3>
      <div className="row pills">{Object.entries(LEVELS).map(([k, [n]]) => <button key={k} className={lv === k ? 'tab on' : 'tab'} onClick={() => { stopSpeak(); setLv(k); setI(0); setWho(null); }}>{n}</button>)}</div>
      <p className="muted">{idx + 1} of {items.length}</p>
      {who === null && <p className={lv === 'paragraph' ? '' : 'big'} lang={langOf(tg).bcp}>{text}</p>}
      {lv === 'word' && <p className="muted">{item.syl} · {item.mean}</p>}
      {meaning && <p className="muted">{meaning}</p>}
      {isEn && kn !== 'en' && lv !== 'word' && <Meaning key={text} text={text} kn={kn} />}
      <div className="row">
        <button className={who === 'ai' ? 'tab on' : ''} onClick={() => setWho('ai')} disabled={!canSpeak}>🔊 AI will speak</button>
        <button className={who === 'me' ? 'tab on' : ''} onClick={() => { stopSpeak(); setWho('me'); }}>🎤 I will speak</button>
        <button className="ghost" onClick={() => go(-1)}>← Previous</button><button className="ghost" onClick={() => go(1)}>Next →</button>
      </div>
      {who === 'ai' && (lv === 'real' ? <ClipPlayer key={text} text={text} file={item.file} /> : <Narrate key={text} text={text} ctx={ctx} />)}
      {who === 'me' && <Attempt key={text} variants={text} ctx={ctx} />}
    </div>
  </>);
}

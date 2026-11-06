import { useMemo, useRef, useState } from 'react';
import { speak, stopSpeak, canSpeak, pickVoice } from './speech.js';
import RecordCompare from './RecordCompare.jsx';
import HumanVoices from './HumanVoices.jsx';
import VoiceLibrary from './VoiceLibrary.jsx';
import AccentLab from './AccentLab.jsx';
import OfflinePack from './OfflinePack.jsx';
import { SENT, PARA, HARD } from './data3.js';
import { ACCENTS as PAIRS } from './data.js';
import { accentsFor, accentLabel, phraseSet, langOf } from './langs.js';
import VoicePicker from './VoicePicker.jsx';
import Meaning from './Meaning.jsx';

// view: which section of the Accents area to show (the top menu picks it). Default 'compare'.
export default function Accents({ ctx, view = 'compare' }) {
  const { s, award, t } = ctx, tg = s.target || 'en', isEn = tg === 'en';
  const accs = accentsFor(tg), v = s.voice || { accent: accs[0][0], style: 'w1', rate: 0.85 };
  const acc = accs.some((a) => a[0] === v.accent) ? v.accent : accs[0][0];
  const KINDS = isEn ? { word: ['Word', HARD.map((h) => h.w)], sentence: ['Sentence', SENT], paragraph: ['Paragraph', PARA] } : { phrase: ['Phrase', phraseSet(tg)] };
  const [k0, setKind] = useState('sentence'), [i, setI] = useState(0), [now, setNow] = useState(''), [rep, setRep] = useState('');
  const kind = KINDS[k0] ? k0 : Object.keys(KINDS)[0], list = KINDS[kind][1], text = list[i % list.length], token = useRef(0);
  const ALL = isEn ? ['en-US', 'en-GB', 'en-IE', 'en-AU', 'en-IN'] : accs.map((a) => a[0]).slice(0, 5);
  const playAll = () => {
    const my = ++token.current; let k = 0; const used = []; setRep('');
    const next = () => {
      if (my !== token.current || k >= ALL.length) {
        setNow('');
        if (my === token.current) { const by = {}; used.forEach(([lab, nm]) => { (by[nm] = by[nm] || []).push(lab); }); const dup = Object.entries(by).filter(([, l]) => l.length > 1); setRep(dup.length ? 'Same installed voice used for: ' + dup.map(([nm, l]) => `${l.join(' and ')} (${nm})`).join('; ') + '. Those regions sound identical on this device. Install more voices or use Edge (see Voice finder).' : 'Each region used a different voice.'); }
        return;
      }
      const a = ALL[k++], rv = pickVoice(a, v.style), nm = rv.voice ? rv.voice.name : 'default voice';
      used.push([accentLabel(tg, a), nm]); setNow(accentLabel(tg, a) + ' · ' + nm + (rv.exact ? '' : ' (no regional voice)'));
      speak(text, { accent: a, style: v.style, rate: v.rate, onEnd: next });
    };
    next();
  };
  const halt = () => { token.current++; stopSpeak(); setNow(''); };

  const [pi, setPi] = useState(0), [r, setR] = useState(null);
  const pair = PAIRS[pi % PAIRS.length], target = useMemo(() => (Math.random() < 0.5 ? pair.a : pair.b), [pi]);
  const pick = (w) => { if (r) return; if (w === target) { setR('ok'); award(10, 'accents'); } else setR('no'); };

  return (<>
    {view === 'compare' && <VoicePicker ctx={ctx} />}
    {view === 'compare' && <div className="card"><h3>Voice compare{isEn ? '' : ': ' + langOf(tg).name}</h3>
      <div className="row pills">{Object.entries(KINDS).map(([k, [n]]) => <button key={k} className={kind === k ? 'tab on' : 'tab'} onClick={() => { halt(); setKind(k); setI(0); }}>{n}</button>)}</div>
      <label>Choose text <select value={i % list.length} onChange={(e) => { halt(); setI(+e.target.value); }}>{list.map((x, k) => <option key={k} value={k}>{x.length > 50 ? x.slice(0, 50) + '…' : x}</option>)}</select></label>
      <p className={kind === 'paragraph' ? '' : 'big'} lang={langOf(tg).bcp}>{text}</p>
      <Meaning text={text} from={tg} to={s.known || 'en'} ctx={ctx} />
      <div className="row"><button onClick={() => speak(text, { ...v, accent: acc })} disabled={!canSpeak}>🔊 Play: {accentLabel(tg, acc)}</button>
        <button className="ghost" onClick={now ? halt : playAll} disabled={!canSpeak || (!isEn && accs.length < 2)}>{now ? '⏹ Stop' : `🌍 Compare ${ALL.length} accents`}</button></div>
      {!isEn && accs.length < 2 && <p className="muted">This language has one accent option in the app. Different regional accents are available for English, Spanish, French, German, Portuguese, Chinese, Arabic and more.</p>}
      {now && <p role="status">Now playing: <strong>{now}</strong></p>}
      {rep && <p role="status" className={rep.startsWith('Same') ? 'fb no' : 'fb ok'}>{rep}</p>}
      <RecordCompare text={text} accent={acc} rate={v.rate} />
      <p className="muted">Speakers of the same language sound different in different regions. Pick a region and listen, then compare. {isEn ? 'European-accented options use another language’s voice to read English, so they are experimental. ' : ''}You only hear regions your device has voices for.</p>
    </div>}
    {view === 'lab' && (isEn ? <AccentLab ctx={ctx} /> : <div className="card"><h3>Accent lab</h3><p>The accent lab explains how English accents differ, so it is shown when English is the language you want to learn. Choose English under “I want to learn”.</p></div>)}
    {view === 'human' && (isEn ? <HumanVoices ctx={ctx} /> : <div className="card"><h3>Real human accent recordings</h3><p>These recordings are English accents. Choose English under “I want to learn” to use them, or open <strong>Real voice library</strong> for recordings in other languages.</p></div>)}
    {view === 'offline' && (isEn ? <OfflinePack /> : <div className="card"><h3>Offline pack</h3><p>The offline audio pack is for English practice. Choose English under “I want to learn” to use it.</p></div>)}
    {view === 'library' && <VoiceLibrary ctx={ctx} initial={tg} />}
    {view === 'compare' && isEn && <div className="card"><h3>Sound pairs: {pair.a} / {pair.b}</h3><p>🦜 {pair.tip}</p>
      <div className="row"><button onClick={() => speak(pair.a, v)}>🔊 {pair.a}</button><button onClick={() => speak(pair.b, v)}>🔊 {pair.b}</button></div>
      <div className="row"><button className="ghost" onClick={() => speak(target, v)}>▶ Play mystery word</button><button className="opt" onClick={() => pick(pair.a)}>{pair.a}</button><button className="opt" onClick={() => pick(pair.b)}>{pair.b}</button></div>
      {r && <p className={`fb ${r}`} role="status">{r === 'ok' ? t.great : t.again} (It was “{target}”.)</p>}
      <button className="ghost" onClick={() => { setPi(pi + 1); setR(null); }}>{t.next}</button></div>}
  </>);
}
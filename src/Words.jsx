import { useState } from 'react';
import { HARD_WORDS } from './data.js';
import { phraseSet, langOf } from './langs.js';
import { speak, canSpeak } from './speech.js';
import { todayLocal } from './store.js';

const today = todayLocal;
export default function Words({ ctx: { s, rateWord, award } }) {
  const [show, setShow] = useState(false);
  const tg = s.target || 'en', kn = s.known || 'en';
  // English: hard words. Other languages: the phrasebook as flashcards with meanings in the language you know.
  const deck = tg === 'en'
    ? HARD_WORDS.map((h) => ({ w: h.w, mean: h.mean, extra: kn === 'hi' ? h.hi : kn === 'hing' ? h.hing : '', ex: h.ex }))
    : phraseSet(tg).map((p, i) => ({ w: p, mean: kn === tg ? '' : phraseSet(kn)[i], extra: '', ex: '' }));
  const due = deck.filter((w) => !s.words[w.w] || s.words[w.w].due <= today());
  const w = due[0];
  if (!w) return <div className="card"><h3>All caught up 🌿</h3><p>No cards are due today. Come back tomorrow for your next review.</p></div>;
  const rate = (ok) => { rateWord(w.w, ok); if (ok) award(8, 'words'); setShow(false); };
  return (<div className="card">
    <h3 lang={langOf(tg).bcp}>{tg === 'en' ? 'Hard word' : 'Phrase card'}: {w.w} {canSpeak && <button className="ghost small" aria-label="Hear it" onClick={() => speak(w.w)}>🔊</button>}</h3>
    <p className="muted">{due.length} due today</p>
    {show ? (<><p className="big">{w.mean}</p>{w.extra && <p>{w.extra}</p>}{w.ex && <p><em>“{w.ex}”</em></p>}
      <div className="row"><button onClick={() => rate(true)}>I knew it</button><button className="ghost" onClick={() => rate(false)}>Show again soon</button></div></>)
      : <button onClick={() => setShow(true)}>Reveal meaning</button>}
  </div>);
}

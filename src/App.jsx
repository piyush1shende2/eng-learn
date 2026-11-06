import { Component, Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { useStore, levelOf, todayLocal } from './store.js';
import { T, IFACE, LANGS, EXTRA_LANGS, isChatOnly, accentsFor, langOf } from './langs.js';
import { Plane, Leaf, Mountains, Scenery } from './Art.jsx';
const Cursive = lazy(() => import('./Cursive.jsx')); // loaded only when its tab opens (keeps start-up light on low-end devices)
const Accents = lazy(() => import('./Accents.jsx')); // loaded only when its tab opens (keeps start-up light on low-end devices)
const Words = lazy(() => import('./Words.jsx')); // loaded only when its tab opens (keeps start-up light on low-end devices)
const Notebook = lazy(() => import('./Notebook.jsx')); // loaded only when its tab opens (keeps start-up light on low-end devices)
const Learn = lazy(() => import('./Learn.jsx')); // loaded only when its tab opens (keeps start-up light on low-end devices)
const Speak = lazy(() => import('./Speak.jsx')); // loaded only when its tab opens (keeps start-up light on low-end devices)
const Chat = lazy(() => import('./Chat.jsx')); // loaded only when its tab opens (keeps start-up light on low-end devices)
const FreeChat = lazy(() => import('./FreeChat.jsx')); // loaded only when its tab opens (keeps start-up light on low-end devices)
const TeacherChat = lazy(() => import('./teacher/TeacherChat.jsx')); // "Chat with teacher": AI coach, loaded only when its tab opens
const TranslatorTab = lazy(() => import('./Translator.jsx')); // loaded only when its tab opens (keeps start-up light on low-end devices)
import { setCurrent, setSound, onSpeech } from './speech.js';
import { PUZZLES, CATS, phrasePuzzles } from './registry.jsx';

class Boundary extends Component {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  render() { return this.state.err ? <div className="card"><h3>Something went wrong</h3><p>Your progress is safe. Reload the page to continue.</p></div> : this.props.children; }
}

const dayCount = (s) => Object.keys(s.done).filter((k) => /^day[0-9]+$/.test(k)).length;
const BADGES = [
  ['First flight', (s) => s.xp >= 10], ['Level 2', (s) => s.xp >= 100], ['3-day streak', (s) => s.streak >= 3],
  ['Cursive start', (s) => s.done.cursive > 0], ['Word collector', (s) => Object.keys(s.words).length >= 3],
  ['Puzzle explorer', (s) => Object.keys(s.done).filter((k) => !/^day[0-9]+$/.test(k)).length >= 5],
  ['Maze runner', (s) => s.done.maze > 0], ['Word hunter', (s) => s.done.wordsearch > 0], ['Course starter', (s) => dayCount(s) >= 3],
];

// Top menu: 5 main sections, each with its own sub-options. Every feature is still reachable.
// Leaf ids ('learn', 'speak', 'acc-library', ...) are the screens; groups only decide how they are listed.
const MENU = [
  { id: 'home', icon: '🏠', label: (t) => t.home, subs: [['home', (t) => t.home]] },
  { id: 'learn', icon: '📚', label: (t) => t.learn, subs: [['learn', (t) => t.learn], ['words', (t) => t.words], ['cursive', (t) => t.cursive], ['notebook', (t) => t.notebook]] },
  { id: 'speak', icon: '🗣️', label: (t) => t.speak, subs: [['speak', (t) => t.speak], ['chat', (t) => t.chat], ['freechat', (t) => t.freechat], ['teacher', () => 'Chat with teacher']] },
  { id: 'accents', icon: '🎧', label: (t) => t.accents, subs: [['acc-compare', () => 'Compare voices'], ['acc-human', () => 'Real accents'], ['acc-library', () => 'Real voice library'], ['acc-lab', () => 'Accent lab'], ['acc-offline', () => 'Offline pack']] },
  { id: 'more', icon: '🧩', label: () => 'Puzzles & tools', subs: [['puzzles', (t) => t.puzzles], ['translate', (t) => t.translate]] },
];

export default function App() {
  const st = useStore();
  const { s, set } = st;
  const ti = T[s.ui] || T.en, tk = T[s.known] || T.en, tg = s.target || 'en', kn = s.known || 'en', isEn = tg === 'en';
  const t = { ...ti, great: tk.great, again: tk.again, hint: tk.hint }; // feedback speaks the language you know
  const [tab, setTab] = useState('home'), [game, setGame] = useState(null), lastSub = useRef({});
  const group = MENU.find((g) => g.subs.some((x) => x[0] === tab)) || MENU[0];
  const goTab = (k) => { lastSub.current[(MENU.find((g) => g.subs.some((x) => x[0] === k)) || MENU[0]).id] = k; setTab(k); };
  const goGroup = (g) => setTab(lastSub.current[g.id] || g.subs[0][0]);
  const ctx = { ...st, t };
  const lvl = levelOf(s.xp), prog = s.xp % 100;
  useEffect(() => { setCurrent(s.voice); setSound(!s.mute); }, [s.voice, s.mute]);
  const [cap, setCap] = useState(''), capTimer = useRef();
  useEffect(() => onSpeech((t) => { clearTimeout(capTimer.current); if (t) setCap(t); else capTimer.current = setTimeout(() => setCap(''), 3500); }), []);
  const todayIso = todayLocal(), GOAL = 30, dx = s.daily && s.daily.d === todayIso ? s.daily.xp : 0;
  const phrase = useMemo(() => phrasePuzzles(tg, kn), [tg, kn]);
  const puzzles = useMemo(() => [...(isEn ? PUZZLES : PUZZLES.filter((x) => x.id === 'maze')), ...phrase], [isEn, phrase]);
  const cur = puzzles.find((x) => x.id === game);
  useEffect(() => { const l = langOf(s.ui); document.documentElement.lang = l.bcp.slice(0, 2); document.documentElement.dir = l.rtl ? 'rtl' : 'ltr'; }, [s.ui]);
  const accs = accentsFor(tg), accVal = accs.some((a) => a[0] === (s.voice || {}).accent) ? s.voice.accent : accs[0][0];
  const chooseTarget = (v) => { setGame(null); set({ target: v, voice: { ...s.voice, accent: accentsFor(v)[0][0] } }); };
  const chooseKnown = (v) => set({ known: v, ...(s.ui === s.known ? { ui: v } : {}) }); // the interface follows the language you know until you pick another
  const needEn = !isEn && tab === 'freechat';
  const chatOnly = isChatOnly(tg) && tab !== 'home' && tab !== 'teacher'; // extra languages are taught by the AI teacher only

  return (<div className="app"><Scenery />
    <header>
      <h1>SpeakWise <span>AI</span></h1>
      <label><input type="checkbox" checked={!!s.present} onChange={(e) => set({ present: e.target.checked })} /> {t.captions}</label>
      <label><input type="checkbox" checked={!s.mute} onChange={(e) => set({ mute: !e.target.checked })} /> {t.sounds}</label>
    </header>
    <section className="menu" aria-label="Language settings">
      <label>{t.ui}<select value={s.ui} onChange={(e) => set({ ui: e.target.value })}>{IFACE.map((l) => <option key={l.id} value={l.id}>{l.native} ({l.name})</option>)}</select></label>
      <label>{t.known}<select value={s.known} onChange={(e) => chooseKnown(e.target.value)}>{IFACE.map((l) => <option key={l.id} value={l.id}>{l.native} ({l.name})</option>)}</select></label>
      <label>{t.want}<select value={tg} onChange={(e) => chooseTarget(e.target.value)}>{LANGS.map((l) => <option key={l.id} value={l.id}>{l.native} ({l.name})</option>)}<optgroup label="More languages (Chat with teacher)">{EXTRA_LANGS.map((l) => <option key={l.id} value={l.id}>{l.native} ({l.name})</option>)}</optgroup></select></label>
      <label>{t.accent}<select value={accVal} onChange={(e) => set({ voice: { ...s.voice, accent: e.target.value } })}>{accs.map((a) => <option key={a[0]} value={a[0]}>{a[1]}</option>)}</select></label>
    </section>
    <nav aria-label="Main" className="mainnav">{MENU.map((g) => <button key={g.id} className={group.id === g.id ? 'tab on' : 'tab'} aria-current={group.id === g.id} onClick={() => goGroup(g)}><span aria-hidden="true">{g.icon}</span> {g.label(t)}</button>)}</nav>
    {group.subs.length > 1 && <nav aria-label={group.label(t) + ' sections'} className="subnav">{group.subs.map(([k, l]) => <button key={k} className={tab === k ? 'tab sub on' : 'tab sub'} aria-current={tab === k} onClick={() => goTab(k)}>{l(t)}</button>)}</nav>}
    <main><Boundary key={tab + game}><Suspense fallback={<div className="card" role="status">Loading…</div>}>
      {tab === 'home' && (<>
        <section className="card hero">
          <h2>{t.level} {lvl} · {s.xp} XP · 🔥 {s.streak} {t.streak}</h2>
          <div className="flight" role="progressbar" aria-valuenow={prog} aria-valuemin="0" aria-valuemax="100" aria-label="Progress to next level">
            <div className="path" /><div className="plane" style={{ left: `calc(${prog}% - ${prog * 0.9}px)` }}><Plane size={90} /></div>
            <span className="end">🏁 {t.level} {lvl + 1}</span>
          </div>
          <p>🌍 {langOf(tg).native} · {accentsFor(tg).find((a) => a[0] === accVal)[1]}{kn !== tg ? ` · ${langOf(kn).native} → ${langOf(tg).native}` : ''}</p>
          <p className="muted">{100 - prog} XP to the next level. Every puzzle moves your plane forward.</p>
          <p>Daily goal: {Math.min(dx, GOAL)} / {GOAL} XP {dx >= GOAL ? '🎯 done!' : ''}</p><progress max={GOAL} value={Math.min(dx, GOAL)} aria-label="Daily XP goal" />
          <Mountains width={200} />
        </section>
        <section className="card"><h3>Badges</h3><div className="row">{BADGES.map(([n, f]) => <span key={n} className={f(s) ? 'badge on' : 'badge'}>{f(s) ? '✓ ' : '○ '}{n}</span>)}</div></section>
        <section className="card"><h3>Your guides</h3>
          <p>🦊 Fox: word puzzles · 🦉 Owl: grammar · 🦜 Parrot: speaking and sounds · 🐬 Dolphin: listening</p>
          <p className="muted">Speak or type with live guidance, 15 chat scenes, {PUZZLES.length} puzzles, 60-day speaking path, workplace English, feelings and grammar notes. Hindi, Hinglish and English help is never locked.</p></section>
      </>)}
      {chatOnly && <div className="card"><h3>{langOf(tg).native} ({langOf(tg).name})</h3><p>{langOf(tg).name} is practised with the AI teacher. Lessons, puzzles and the phrasebook are not available for it yet.</p><div className="row"><button onClick={() => goTab('teacher')}>👩‍🏫 Open Chat with teacher</button></div></div>}
      {!chatOnly && tab === 'learn' && <Learn ctx={ctx} />}
      {!chatOnly && tab === 'speak' && <Speak ctx={ctx} />}
      {!chatOnly && needEn && <div className="card"><h3>{t[tab]}</h3><p>Free chat uses an English-only chatbot and grammar checker. Choose English under “{t.want}” to use it. The Chat tab works in your language with translated scenes.</p></div>}
      {!chatOnly && tab === 'chat' && <Chat ctx={ctx} />}
      {tab === 'teacher' && <TeacherChat ctx={ctx} />}
      {!chatOnly && tab === 'translate' && <TranslatorTab ctx={ctx} />}
      {!chatOnly && tab === 'freechat' && isEn && <FreeChat ctx={ctx} />}
      {!chatOnly && tab === 'puzzles' && (cur ? (<><button className="ghost" onClick={() => setGame(null)}>← All puzzles</button>{cur.render(ctx)}</>) : CATS.filter((c) => puzzles.some((x) => x.cat === c)).map((c) => (
        <section key={c} className="card"><h3>{c}</h3><div className="row">{puzzles.filter((x) => x.cat === c).map((x) => <button key={x.id} className="tab" onClick={() => setGame(x.id)}><span aria-hidden="true">{x.emoji}</span> {x.title}{s.done[x.id] ? ' ✓' : ''}</button>)}</div></section>)))}
      {!chatOnly && tab === 'cursive' && <Cursive ctx={ctx} />}
      {!chatOnly && tab.startsWith('acc-') && <Accents ctx={ctx} view={tab.slice(4)} />}
      {!chatOnly && tab === 'words' && <Words ctx={ctx} />}
      {!chatOnly && tab === 'notebook' && <Notebook ctx={ctx} />}
    </Suspense></Boundary></main>
    {s.present && cap && <div className="caption" role="status" aria-live="polite"><span aria-hidden="true">🔊 </span>{cap}</div>}
    <footer><Leaf size={36} /> Works offline after the first visit. Progress is stored in this browser only.</footer>
  </div>);
}

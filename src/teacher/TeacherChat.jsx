import { useEffect, useRef, useState } from 'react';
import { SR, listen, micError } from '../speech.js';
import { resolveTeacher } from './settings.js';
import { LEVELS, SCENES } from './scenes.js';
import { checkHealth, streamChat } from './transport.js';
import { splitReply, cleanForSpeech, pickVoice, readTags, guessLevel } from './replyParts.js';

const QUICK = ['Teach me a phrase', 'Correct my sentence', 'Let’s role-play'];
const STATUS = { checking: 'Checking the teacher server…', ready: '🟢 Teacher server connected', nokey: '🟠 Teacher server is running but has no API key (add GEMINI_API_KEY_1 to server/.env and restart it)', offline: '🔴 Teacher server not reachable. Start it with “npm start” inside the server folder (see the README).' };
const synth = () => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null);
const VISIBLE_SCENES = 10;

// The conversation survives switching between tabs (it is not saved after the page is reloaded).
let kept = null;

// Chat with teacher: an AI speaking coach (Gemini, through the server/ folder). Languages and accent come from the main menu.
// The teacher opens by asking the learner's level and the scenario to practise, then runs the practice.
export default function TeacherChat({ ctx }) {
  const st = resolveTeacher(ctx.s);
  const [msgs, setMsgs] = useState(() => (kept ? kept.msgs : []));
  const [profile, setProfile] = useState(() => (kept ? kept.profile : { level: '', scene: '' }));
  const [draft, setDraft] = useState(''), [busy, setBusy] = useState(false), [live, setLive] = useState(false);
  const [speakOn, setSpeakOn] = useState(true), [notice, setNotice] = useState(''), [server, setServer] = useState('checking'), [allScenes, setAllScenes] = useState(false);
  const listRef = useRef(null), inputRef = useRef(null), micRef = useRef(null), runRef = useRef(0), ctlRef = useRef(null), sigRef = useRef(null), turnRef = useRef(null);
  const msgsRef = useRef(msgs), profileRef = useRef(profile), speakOnRef = useRef(speakOn);
  useEffect(() => { msgsRef.current = msgs; kept = { msgs: msgs.filter((m) => !m.streaming), profile }; }, [msgs, profile]);
  useEffect(() => { speakOnRef.current = speakOn; }, [speakOn]);
  useEffect(() => { synth() && synth().getVoices(); }, []); // voices load asynchronously; touching the list lets them fill
  useEffect(() => { let off = false; checkHealth().then((r) => { if (!off) setServer(r); }); return () => { off = true; }; }, []);
  useEffect(() => () => { runRef.current++; ctlRef.current && ctlRef.current.abort(); micRef.current && micRef.current.stop(); synth() && synth().cancel(); }, []); // leaving the section stops everything
  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [msgs, busy]);

  const turns = msgs.filter((m) => m.role === 'user').length;
  const answered = msgs.some((m) => m.role === 'model' && m.text && !m.streaming);
  const stage = !profile.level ? 'level' : !profile.scene ? 'scene' : 'practice';

  // Same language: one voice. Different language: explanation in the reply language, [[phrases]] in the practice language with its accent.
  function speak(text) {
    const s = synth();
    if (!s) { setNotice('Speech playback is not supported in this browser.'); return; }
    s.cancel();
    const pieces = st.sameLanguage ? [{ phrase: false, text }] : splitReply(text);
    let missing = null;
    pieces.forEach((piece) => {
      const spoken = cleanForSpeech(piece.text);
      if (!spoken) return;
      const accent = piece.phrase ? st.accent : st.replyAccent, u = new SpeechSynthesisUtterance(spoken), { voice } = pickVoice(accent, s.getVoices());
      if (voice) u.voice = voice; else missing = missing || accent.locale;
      u.lang = voice ? voice.lang : accent.locale; u.rate = accent.rate ?? 0.96; u.pitch = accent.pitch ?? 1.03;
      s.speak(u);
    });
    if (missing && s.getVoices().length) setNotice(`No voice for “${missing}” is installed on this device, so a default voice may be used. Install the language voice in your system settings for the right accent.`);
  }
  const stopAudio = () => synth() && synth().cancel();

  function stopMic() { micRef.current && micRef.current.stop(); micRef.current = null; setLive(false); }
  function startMic() {
    if (!SR) { setNotice('Voice typing is not supported here. Try Chrome or Edge, or type your message.'); return; }
    stopAudio(); // so the microphone does not hear the teacher
    const base = draft.trim();
    setNotice('Listening… speak naturally. Press Stop when you finish.'); setLive(true);
    try {
      micRef.current = listen({
        lang: st.accent.listenLocale,
        onText: (text) => setDraft(`${base}${base && text ? ' ' : ''}${text}`.trim()),
        onEnd: () => { micRef.current = null; setLive(false); },
        onError: (e) => { micRef.current = null; setLive(false); setNotice(micError(e)); },
      });
    } catch { setLive(false); setNotice('Could not start the microphone. Please try again.'); }
  }

  // One round trip to the teacher. intro=true: the teacher opens the session (greeting + level question).
  async function turn({ text = '', intro = false }) {
    ctlRef.current && ctlRef.current.abort();
    const prior = msgsRef.current, run = ++runRef.current, ctl = new AbortController(), before = profileRef.current;
    ctlRef.current = ctl;
    const base = intro ? [] : [...prior, { role: 'user', text }];
    msgsRef.current = [...base, { role: 'model', text: '', streaming: true }];
    setMsgs(msgsRef.current); setBusy(true);
    const patchLast = (m) => setMsgs((cur) => cur.map((x, i) => (i === cur.length - 1 ? m : x)));
    try {
      const history = intro ? [] : prior.filter((m) => m.text).slice(-10).map((m) => ({ role: m.role, text: m.text }));
      const answer = await streamChat({
        message: text, intro, history, level: before.level, scene: before.scene,
        practiceLanguage: st.practice.name, accent: st.accent.ai, replyLanguage: st.reply.name, replyAccent: st.replyAccent.ai,
      }, (partial) => { if (run === runRef.current) patchLast({ role: 'model', text: readTags(partial).text, streaming: true }); }, ctl.signal);
      if (run !== runRef.current) return; // Start over or a menu change happened while the teacher was answering
      const read = readTags(answer), clean = read.text.trim() || 'Let’s try that again. Could you say a little more?';
      patchLast({ role: 'model', text: clean, streaming: false });
      // The teacher tags the answers to the two opening questions. If a tag is missing, fall back to what the learner typed or tapped.
      let { level, scene } = { level: read.level || before.level, scene: read.scene || before.scene };
      if (!intro && !level) level = guessLevel(text);
      if (!intro && before.level && !before.scene && !scene) scene = text.slice(0, 60);
      profileRef.current = { level, scene }; setProfile(profileRef.current);
      setServer('ready');
      if (speakOnRef.current) speak(clean);
    } catch (err) {
      if (run !== runRef.current || (err && err.name === 'AbortError')) return;
      setMsgs(() => { msgsRef.current = intro ? [] : prior; return msgsRef.current; });
      if (!intro) setDraft(text);
      setNotice(err.message || 'Something went wrong. Please try again.');
      if (/reach the teacher server/i.test(err.message || '')) setServer('offline');
    } finally {
      if (run === runRef.current) { setBusy(false); inputRef.current && inputRef.current.focus(); }
    }
  }
  useEffect(() => { turnRef.current = turn; });

  // The teacher opens the session by itself. When the menu changes before the learner has said anything, it opens again in the new languages.
  useEffect(() => {
    const prev = sigRef.current; sigRef.current = st.key;
    const changed = prev !== null && prev !== st.key;
    const timer = setTimeout(() => {
      const current = msgsRef.current;
      if (current.some((m) => m.role === 'user')) { if (changed) { synth() && synth().cancel(); setNotice('Menu changed. From your next message the teacher uses the new languages and accent. Press “Start over” to restart the lesson with them.'); } return; }
      if (current.some((m) => m.role === 'model' && !m.streaming) && !changed) return; // restored from an earlier visit
      synth() && synth().cancel();
      turnRef.current({ intro: true });
    }, 450);
    return () => clearTimeout(timer);
  }, [st.key]);

  function send(e, forced) {
    e && e.preventDefault && e.preventDefault();
    const text = (forced ?? draft).trim();
    if (!text || busy) return;
    stopMic(); setNotice(''); setDraft(''); setAllScenes(false);
    turn({ text });
  }

  function startOver() {
    runRef.current++; ctlRef.current && ctlRef.current.abort(); stopMic(); stopAudio();
    msgsRef.current = []; profileRef.current = { level: '', scene: '' };
    setMsgs([]); setProfile(profileRef.current); setBusy(false); setNotice(''); setAllScenes(false);
    turn({ intro: true });
  }
  const rtl = st.rtl ? 'rtl' : 'ltr';
  const shownScenes = allScenes ? SCENES : SCENES.slice(0, VISIBLE_SCENES);
  const pickScene = ([name]) => send(null, stage === 'scene' ? name : `Let’s practise a different scenario: ${name}`);

  return (<>
    <div className="card"><h3>👩‍🏫 Chat with teacher</h3>
      <p className="muted">An AI speaking coach. Your languages and accent come from the menu at the top. The teacher starts by asking your level and the scenario you want, then you practise by typing or speaking and get kind corrections and useful phrases. {STATUS[server]}</p>
      {(server === 'offline' || server === 'nokey') && <div className="row"><button className="ghost" onClick={() => { setServer('checking'); checkHealth().then(setServer); }}>↻ Check again</button></div>}
    </div>
    <div className="card">
      <p className="muted">🌍 Practising <strong>{st.practice.name}</strong> ({st.accent.label}){st.accent.approximate ? ' – experimental accent, the voice only approximates it' : ''} · Teacher replies in <strong>{st.reply.name}</strong> · Level: <strong>{profile.level || 'not chosen yet'}</strong> · Scenario: <strong>{profile.scene || 'not chosen yet'}</strong></p>
      <div className="row"><span className="muted">{turns} turns</span>
        <button className={speakOn ? '' : 'ghost'} aria-pressed={speakOn} onClick={() => { setSpeakOn(!speakOn); stopAudio(); }}>{speakOn ? '🔊 Read replies aloud: on' : '🔇 Read replies aloud: off'}</button>
        <button className="ghost" onClick={startOver}>↺ Start over</button></div>
      <div className="chat tall" ref={listRef} aria-live="polite" dir={rtl}>
        {!msgs.length && !busy && <div className="bubble ai" dir="auto">👩‍🏫 Hi! I’m your teacher. Press “Start lesson” and I’ll ask your level and what you’d like to practise. <div><button className="small" onClick={() => turn({ intro: true })}>▶ Start lesson</button></div></div>}
        {msgs.map((m, i) => (m.role === 'user'
          ? <div key={i} className="bubble me" dir="auto">{m.text}</div>
          : <div key={i} className="bubble ai" dir="auto">👩‍🏫 {m.text ? splitReply(m.text).map((p, k) => (p.phrase ? <mark className="teacher-phrase" key={k}>{p.text}</mark> : <span key={k}>{p.text}</span>)) : <span className="muted">Your teacher is joining…</span>}
            {m.text && !m.streaming && <div><button className="ghost small" onClick={() => speak(m.text)} title="Listen to this reply">🔊 Listen</button></div>}</div>))}
      </div>
      {notice && <p className="muted" role="status">ℹ️ {notice} <button className="ghost small" onClick={() => setNotice('')} aria-label="Dismiss message">×</button></p>}
      {answered && !busy && stage === 'level' && <div className="row pills"><span className="muted">Tap your level or type it:</span>{LEVELS.map(([name, icon]) => <button key={name} className="tab" onClick={() => send(null, name)}><span aria-hidden="true">{icon}</span> {name}</button>)}</div>}
      {answered && !busy && (stage === 'scene' || allScenes) && <div className="row pills"><span className="muted">{stage === 'scene' ? 'Tap a scenario or describe your own:' : 'Switch to another scenario:'}</span>
        {shownScenes.map((sc) => <button key={sc[0]} className="tab" onClick={() => pickScene(sc)}><span aria-hidden="true">{sc[1]}</span> {sc[0]}</button>)}
        <button className="ghost" aria-expanded={allScenes && stage === 'scene' ? true : undefined} onClick={() => setAllScenes(!allScenes)}>{allScenes ? 'Fewer ▴' : `${SCENES.length} scenarios ▾`}</button></div>}
      {answered && !busy && stage === 'practice' && <div className="row pills"><span className="muted">Try saying:</span>{QUICK.map((p) => <button key={p} className="tab" onClick={() => setDraft(p)}>{p}</button>)}
        {!allScenes && <button className="ghost" onClick={() => setAllScenes(true)}>🎭 Change scenario</button>}</div>}
      <form className="row" onSubmit={send}>
        {SR ? <button type="button" className={live ? 'rec' : ''} aria-pressed={live} onClick={live ? stopMic : startMic}>{live ? '⏹ Stop' : '🎤 Speak'}</button> : null}
        <input ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={live ? 'Listening… speak now' : stage === 'practice' ? `Type in ${st.practice.name} or tap Speak…` : 'Type your answer or tap Speak…'} dir="auto" lang={st.accent.listenLocale} disabled={busy} aria-label="Your message" style={{ flex: '1 1 220px', minWidth: 0 }} />
        <button type="submit" disabled={!draft.trim() || busy}>{busy ? 'Sending…' : 'Send ➤'}</button>
      </form>
      {!SR && <p className="muted">Voice input is not available in this browser (try Chrome or Edge). Typing works everywhere.</p>}
      <p className="muted">Your messages are sent to your teacher server and from there to Google Gemini to write the reply. The microphone starts only when you press it, and in Chrome and Edge the browser's speech recognition may send your voice to its provider. This chat is not saved after you reload the page.</p>
    </div>
  </>);
}

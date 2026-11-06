// Speech helpers: text-to-speech voices/accents, speech recognition, word alignment, grammar tips.
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
export const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export const ACCENTS = [
  { id: 'en-US', label: 'American English' }, { id: 'en-GB', label: 'British English' }, { id: 'en-IE', label: 'Irish English' },
  { id: 'en-AU', label: 'Australian English' }, { id: 'en-IN', label: 'Indian English' }, { id: 'en-ZA', label: 'South African English' },
  { id: 'en-CA', label: 'Canadian English' }, { id: 'en-NZ', label: 'New Zealand English' },
  { id: 'fr-FR', label: 'French-accented English (experimental)' }, { id: 'de-DE', label: 'German-accented English (experimental)' },
  { id: 'es-ES', label: 'Spanish-accented English (experimental)' }, { id: 'it-IT', label: 'Italian-accented English (experimental)' },
  { id: 'nl-NL', label: 'Dutch-accented English (experimental)' }, { id: 'pt-PT', label: 'Portuguese-accented English (experimental)' },
];
// Voice styles: each picks a different installed voice when available, then shifts pitch/speed.
export const STYLES = [
  { id: 'w1', label: 'Woman 1 (clear)', g: 'f', n: 0, pitch: 1, rate: 1 }, { id: 'w2', label: 'Woman 2 (bright)', g: 'f', n: 1, pitch: 1.2, rate: 1 },
  { id: 'w3', label: 'Woman 3 (calm)', g: 'f', n: 2, pitch: 0.9, rate: 0.9 }, { id: 'w4', label: 'Woman 4 (lively)', g: 'f', n: 3, pitch: 1.1, rate: 1.08 },
  { id: 'm1', label: 'Man 1 (clear)', g: 'm', n: 0, pitch: 0.9, rate: 1 }, { id: 'm2', label: 'Man 2 (deep)', g: 'm', n: 1, pitch: 0.65, rate: 0.95 },
  { id: 'm3', label: 'Man 3 (friendly)', g: 'm', n: 2, pitch: 1, rate: 1.05 }, { id: 'm4', label: 'Man 4 (slow)', g: 'm', n: 3, pitch: 0.8, rate: 0.85 },
  { id: 'k1', label: 'Kid 1 (girl)', g: 'k', n: 0, pitch: 1.8, rate: 1.05 }, { id: 'k2', label: 'Kid 2 (boy)', g: 'k', n: 1, pitch: 1.6, rate: 1 },
  { id: 'k3', label: 'Kid 3 (little)', g: 'k', n: 2, pitch: 2, rate: 1.1 }, { id: 'k4', label: 'Kid 4 (calm)', g: 'k', n: 3, pitch: 1.7, rate: 0.9 },
];

let cache = [];
if (canSpeak) { const load = () => { cache = speechSynthesis.getVoices(); }; load(); speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', load); }
export const voicesFor = (accent) => {
  const a = accent.toLowerCase(), exact = cache.filter((v) => v.lang.replace('_', '-').toLowerCase() === a);
  return exact.length ? exact : cache.filter((v) => v.lang.toLowerCase().startsWith(a.slice(0, 2)) && (a.startsWith('en') ? true : true));
};
const FEM = /female|woman|zira|hazel|susan|samantha|karen|moira|tessa|fiona|heera|libby|sonia|natasha|clara|aria|jenny|catherine|linda|veena|kate|serena|amelie|marie|anna|elsa|paulina|helena|joana|alice|monica|laura/i;
const MALE = /\bmale\b|david|george|mark|daniel|alex\b|fred|rishi|ravi|james|ryan|guy|liam|thomas|oliver|jorge|diego|luca|henri|hans|markus|ricardo|google uk english male/i;
const gender = (v) => (FEM.test(v.name) ? 'f' : MALE.test(v.name) ? 'm' : '?');
const NAT = /natural|neural|online/i;
export const listVoices = () => cache.slice();
// exact = a voice exists for this exact region (for example en-IN). If not, a voice of the same language is used and regions may sound alike.
export function pickVoice(accent, styleId) {
  const st = STYLES.find((x) => x.id === styleId) || STYLES[0], list = voicesFor(accent);
  if (!list.length) return { voice: null, st, exact: false };
  const a = accent.toLowerCase(), exactList = list.filter((v) => v.lang.replace('_', '-').toLowerCase() === a), base = exactList.length ? exactList : list;
  let pool = st.g === 'k' ? base : base.filter((v) => gender(v) === st.g);
  if (!pool.length) pool = base;
  pool = [...pool].sort((x, y) => (NAT.test(y.name) ? 1 : 0) - (NAT.test(x.name) ? 1 : 0));
  return { voice: pool[st.n % pool.length], st, exact: exactList.length > 0 };
}
let cur = { accent: 'en-US', style: 'w1', rate: 0.85, variety: true };
export const setCurrent = (v) => { if (v) cur = { ...cur, ...v }; };
// Subscribers get the text being spoken ("" when finished) - used for on-screen captions.
const subs = new Set(); let seq = 0;
export const onSpeech = (fn) => { subs.add(fn); return () => subs.delete(fn); };
const emit = (v) => subs.forEach((f) => f(v));
const jit = (x, a) => x * (1 + (Math.random() * 2 - 1) * a);
// A stable "speaker" for each scene, so different scenes do not all sound the same.
export const personaStyle = (id) => { let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return ['w1', 'm1', 'w2', 'm3', 'w4', 'm4', 'w3', 'm2'][h % 8]; };
// Speaks sentence by sentence. With "variety" on, pitch and pace change a little each time and
// questions rise while statements fall, so the voice does not sound like the same recording on repeat.
export function speak(text, o = {}) {
  if (!canSpeak) return false;
  if (typeof o === 'number') o = { rate: o };
  const accent = o.accent || cur.accent, { voice, st } = pickVoice(accent, o.style || cur.style);
  const variety = (o.variety === undefined ? cur.variety : o.variety) !== false;
  speechSynthesis.cancel();
  const my = ++seq; emit(text);
  const chunks = [...text.matchAll(/[^.!?。！？;؟]+[.!?。！？;؟]*\s*/g)].map((m) => ({ t: m[0].trim(), off: m.index })).filter((c) => c.t);
  if (!chunks.length) chunks.push({ t: text, off: 0 });
  let k = 0;
  const next = () => {
    if (my !== seq) return;
    if (k >= chunks.length) { emit(''); o.onEnd && o.onEnd(); return; }
    const c = chunks[k++], u = new SpeechSynthesisUtterance(c.t), q = /[?？؟]$/.test(c.t), ex = /[!！]$/.test(c.t), last = k === chunks.length;
    if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = accent;
    u.pitch = Math.max(0.1, Math.min(2, st.pitch * (variety ? jit(1, 0.05) * (q ? 1.1 : last ? 0.96 : 1) : 1)));
    u.rate = Math.max(0.3, Math.min(2, (o.rate || cur.rate) * st.rate * (variety ? jit(1, 0.04) * (ex ? 1.06 : 1) : 1)));
    if (o.onBoundary) u.onboundary = (e) => o.onBoundary(c.off + e.charIndex);
    u.onend = next; u.onerror = next;
    speechSynthesis.speak(u);
  };
  next();
  return !!voice;
}
export const stopSpeak = () => { if (canSpeak) { seq++; emit(''); speechSynthesis.cancel(); } };
// A tone made by the page itself: it travels through the browser tab, so tab sharing carries it (unlike the system voice).
export function beep() {
  try { const A = window.AudioContext || window.webkitAudioContext, c = new A(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value = 880; g.gain.value = 0.2; o.start(); o.stop(c.currentTime + 0.4); setTimeout(() => c.close(), 600); } catch { /* audio unavailable */ }
}

// Keeps listening through pauses (the browser stops on its own after a few seconds of silence),
// joins the pieces together, and prefers the alternative that best matches the expected words.
export function listen({ lang = 'en-US', onText, onEnd, onError, score }) {
  let base = '', cur = '', stopped = false, rec = null, last = Date.now(), restarts = 0, fatal = false;
  const make = () => {
    const r = new SR(); rec = r; r.lang = lang; r.continuous = true; r.interimResults = true; r.maxAlternatives = 3;
    r.onresult = (e) => {
      last = Date.now(); let s = '', c = 0, n = 0;
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i]; let best = res[0];
        if (score) for (let k = 1; k < res.length; k++) if (score(res[k].transcript) > score(best.transcript)) best = res[k];
        s += best.transcript + ' ';
        if (res.isFinal && best.confidence > 0) { c += best.confidence; n++; }
      }
      cur = s.trim(); onText((base + ' ' + cur).trim(), n ? c / n : 0);
    };
    r.onerror = (e) => { if (e.error === 'no-speech' || e.error === 'aborted') return; fatal = true; stopped = true; onError && onError(e.error); };
    r.onend = () => {
      if (!fatal && !stopped && Date.now() - last < 20000 && restarts < 30) {
        base = (base + ' ' + cur).trim(); cur = ''; restarts++;
        setTimeout(() => { if (stopped) return; try { make(); } catch { stopped = true; onEnd && onEnd(); } }, 150);
      } else onEnd && onEnd();
    };
    r.start();
  };
  make();
  return { stop: () => { stopped = true; try { rec && rec.stop(); } catch { /* already stopped */ } } };
}
export const micError = (e) => {
  if (typeof window !== 'undefined' && window.isSecureContext === false) return 'The microphone only works on a secure page. Open the app at http://localhost:5173 (run npm run dev) instead of opening the file directly.';
  const m = { 'not-allowed': 'Microphone permission is blocked. Click the lock icon in the address bar, allow the microphone, and try again.', 'service-not-allowed': 'The browser blocked speech recognition. Allow the microphone for this page and try again.', 'audio-capture': 'No microphone was found. Plug one in or pick the right input in your system sound settings.', network: 'Speech recognition needs an internet connection in this browser (some browsers, such as Brave or Firefox, do not support it). Try Chrome or Edge, or type instead.', 'language-not-supported': 'This language is not supported by your browser. Choose American or British English.', start: 'Could not start the microphone. You can type instead.' };
  return m[e] || `Speech recognition problem (${e}). You can type instead.`;
};

let sound = true;
export const setSound = (v) => { sound = v; };
export function chime(ok) {
  if (!sound) return;
  try {
    const A = window.AudioContext || window.webkitAudioContext, c = new A(), o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination); o.frequency.value = ok ? 660 : 220;
    if (ok) o.frequency.setValueAtTime(880, c.currentTime + 0.12);
    g.gain.setValueAtTime(0.12, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
    o.start(); o.stop(c.currentTime + 0.26); setTimeout(() => c.close(), 400);
  } catch { /* audio not available */ }
}

export const toks = (s) => s.trim().split(/\s+/).filter(Boolean);
export const nw = (w) => w.toLowerCase().replace(/[^\p{L}\p{N}\p{M}']/gu, '');
// Japanese and Chinese have no spaces, so each character is one unit.
export const tokenize = (text, lang = 'en') => (lang === 'ja' || lang === 'zh' ? Array.from(text).filter((c) => /[\p{L}\p{N}]/u.test(c)) : toks(text));
export const recogLang = (s) => { const a = (s.voice && s.voice.accent) || 'en-US'; return (s.target || 'en') === 'en' && !a.startsWith('en') ? 'en-US' : a; };
export function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let p = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; }
  return p[n];
}
// Walk the learner's words against the target: ok (white), bad (red), skip (red); untouched words stay grey.
export function align(target, heard, partial, gentle) {
  const eq = (h, t) => h === t || (gentle && t.length >= 5 && lev(h, t) <= 1); // gentle: accept near matches
  const st = Array(target.length).fill(null), hd = Array(target.length).fill('');
  let p = 0;
  for (let k = 0; k < heard.length && p < target.length; k++) {
    const h = heard[k], last = k === heard.length - 1;
    if (eq(h, target[p])) { st[p] = 'ok'; hd[p] = h; p++; }
    else if (partial && last && target[p].startsWith(h)) break; // word still being typed or spoken
    else if (p + 1 < target.length && eq(h, target[p + 1])) { st[p] = 'skip'; st[p + 1] = 'ok'; hd[p + 1] = h; p += 2; }
    else { st[p] = 'bad'; hd[p] = h; p++; }
  }
  return { st, hd, pos: p };
}
const RULES = [
  [/\b(he|she|it) (don't|do not)\b/i, "With he, she or it, use \"doesn't\" or \"does not\"."],
  [/\bi am agree\b/i, 'Say "I agree" (no "am").'],
  [/\b(he|she|it) (go|have|do|want|like|need|play|work|live)\b/i, 'With he, she or it, add -s: goes, has, does, wants, likes...'],
  [/\b(she|he) are\b|\b(they|we|you) is\b|\bI is\b/, 'Check am / is / are: I am, he is, they are.'],
  [/\bmore better\b/i, 'Say "better", not "more better".'],
  [/\bdidn'?t (went|saw|ate|came|took|gave)\b/i, 'After "didn\'t", use the base verb: didn\'t go.'],
  [/(^|\s)i(\s|$)/, 'Write "I" with a capital letter.'],
  [/\ba (apple|egg|orange|hour|umbrella|elephant)\b/i, 'Use "an" before a vowel sound.'],
  [/\bgood in\b/i, 'We say "good at" a subject.'],
];
export const grammarTips = (text) => RULES.filter(([r]) => r.test(text)).map(([, m]) => m);

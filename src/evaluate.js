// Rule-based checker: corrects common learner mistakes and marks the changed words.
// It catches COMMON errors only; it is not a complete grammar checker.
import { toks, nw } from './speech.js';

const THIRD = { go: 'goes', do: 'does', have: 'has', watch: 'watches', study: 'studies', try: 'tries', carry: 'carries', fly: 'flies', teach: 'teaches', pass: 'passes', fix: 'fixes' };
const VERBS = 'go do have want like need play work live eat think know make take come get study watch love hate enjoy read write speak say see buy use help teach drive try'.split(' ');
// Words after which the verb stays in its base form (questions, modals, "let it go", "make it work").
const BARE = new Set('do does did dont doesnt didnt can could will would shall should may might must cannot lets let make makes made help helps please to'.split(' '));
const third = (v) => THIRD[v] || v + 's';
const BASE = Object.fromEntries(VERBS.map((v) => [third(v), v]));
const PAST = { goed: 'went', eated: 'ate', buyed: 'bought', comed: 'came', taked: 'took', maked: 'made', runned: 'ran', writed: 'wrote', speaked: 'spoke', thinked: 'thought', bringed: 'brought', teached: 'taught', catched: 'caught', gived: 'gave' };
const DIDNT = { went: 'go', saw: 'see', ate: 'eat', came: 'come', took: 'take', gave: 'give', had: 'have', made: 'make', bought: 'buy', did: 'do', got: 'get' };
const SPELL = { recieve: 'receive', definately: 'definitely', wich: 'which', becuase: 'because', freind: 'friend', beautifull: 'beautiful', tommorow: 'tomorrow', thier: 'their', seperate: 'separate', adress: 'address', untill: 'until', writting: 'writing', enviroment: 'environment', goverment: 'government', occured: 'occurred', alot: 'a lot', diffrent: 'different', intresting: 'interesting', wensday: 'Wednesday', tomorow: 'tomorrow', realy: 'really', basicly: 'basically' };
const HARD = { wednesday: 'wenz-day', february: 'feb-roo-air-ee', comfortable: 'kumf-ter-bul', vegetable: 'vej-tuh-bul', schedule: 'shed-yool (UK) or sked-yool (US)', library: 'ly-brair-ee', pronunciation: 'pro-nun-see-AY-shun', thoroughly: 'thur-oh-lee', entrepreneur: 'on-truh-pruh-NUR', restaurant: 'RES-tront', interesting: 'IN-tres-ting', chocolate: 'CHOK-lit', island: 'EYE-lund (the s is silent)', knife: 'nife (the k is silent)', honest: 'ON-ist (the h is silent)', often: 'OF-en', clothes: 'kloze', probably: 'PROB-ab-lee', actually: 'AK-choo-ly', three: 'th-ree (tongue between your teeth)', think: 'th-ink (tongue between your teeth)' };

function diff(orig, fixed) {
  const a = orig.map(nw), b = fixed.map(nw), n = a.length, m = b.length;
  const L = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const keep = Array(m).fill(false); let i = 0, j = 0;
  while (i < n && j < m) { if (a[i] === b[j]) { keep[j] = true; i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
  return fixed.map((w, k) => ({ w, bad: !keep[k] }));
}

export function fixText(text, spoken) {
  let s = text.trim().replace(/\s+/g, ' '); const errs = [];
  const R = (re, rep, why) => { s = s.replace(re, (...a) => { const m = a[0]; const out = typeof rep === 'function' ? rep(...a) : m.replace(new RegExp(re.source, re.flags.replace('g', '')), rep); if (out !== m) errs.push({ from: m, to: out, why }); return out; }); };
  if (!spoken) R(/\bi\b/g, 'I', 'Write "I" with a capital letter.');
  R(/\b(he|she|it) (don't|do not)\b/gi, (m, a, b) => a + (b.toLowerCase() === "don't" ? " doesn't" : ' does not'), "With he, she or it, use doesn't / does not.");
  // Only fix "he go" when no helper word comes before the subject: "Does he like tea?" and "Let it go" are already correct.
  R(new RegExp('\\b(he|she|it) (' + VERBS.join('|') + ')\\b', 'gi'), (m, a, v, off, str) => {
    const prev = (str.slice(0, off).match(/([A-Za-z']+)\W*$/) || [])[1];
    return prev && BARE.has(prev.toLowerCase()) ? m : a + ' ' + third(v.toLowerCase());
  }, 'With he, she or it, the verb needs -s (or -es).');
  R(/\b(I|you|we|they|he|she|it) (is|are|am)\b/gi, (m, a, v) => { const x = a.toLowerCase(), want = x === 'i' ? 'am' : /^(he|she|it)$/.test(x) ? 'is' : 'are'; return v.toLowerCase() === want ? m : a + ' ' + want; }, 'Check am / is / are: I am, he is, they are.');
  R(/\b(I|you|we|they) has\b/gi, (m, a) => a + ' have', 'With I, you, we or they, use "have".');
  R(/\bI am agree\b/gi, 'I agree', 'Say "I agree" (no "am").');
  R(/\b(we|they|you) are agree\b/gi, (m, a) => a + ' agree', 'Say "agree" (no "are").');
  R(/\bmore (better|easier|bigger|faster|cheaper|happier)\b/gi, (m, w) => w, 'Use "better", not "more better".');
  R(new RegExp("\\b(didn't|did not) (" + Object.keys(DIDNT).join('|') + ')\\b', 'gi'), (m, a, v) => a + ' ' + DIDNT[v.toLowerCase()], 'After "didn\'t", use the base verb.');
  R(new RegExp("\\b(doesn't|does not) (" + Object.keys(BASE).join('|') + ')\\b', 'gi'), (m, a, v) => a + ' ' + BASE[v.toLowerCase()], 'After "doesn\'t", use the base verb (no -s).');
  R(new RegExp('\\b(' + Object.keys(PAST).join('|') + ')\\b', 'gi'), (m) => PAST[m.toLowerCase()], 'This verb has an irregular past form.');
  R(new RegExp('\\b(' + Object.keys(SPELL).join('|') + ')\\b', 'gi'), (m) => SPELL[m.toLowerCase()], 'Spelling.');
  R(/\b(he|she|it) (dont|don't)\b/gi, (m, a) => a + " doesn't", "With he, she or it, use doesn't.");
  R(/\b(dont|doesnt|didnt|cant|wont|isnt|arent)\b/gi, (m) => ({ dont: "don't", doesnt: "doesn't", didnt: "didn't", cant: "can't", wont: "won't", isnt: "isn't", arent: "aren't" })[m.toLowerCase()], 'Add the apostrophe in short forms.');
  if (!spoken) R(/\bim\b/gi, "I'm", 'Write "I\'m" with a capital I and an apostrophe.');
  R(/\b([Aa]) ([aeiou]\w*)/g, (m, a, w) => (/^(uni|use|usu|one|once|eur|eu|ewe|uti|ubi)/i.test(w) ? m : (a === 'A' ? 'An ' : 'an ') + w), 'Use "an" before a vowel sound.');
  R(/\b([Aa]n) ([bcdfgjklmnpqrstvwxyz]\w*)/g, (m, a, w) => (/^(hour|honest|honou?r|heir|x-?ray)/i.test(w) || /^[A-Z]{2,}\b/.test(w) ? m : (a === 'An' ? 'A ' : 'a ') + w), 'Use "a" before a consonant sound.');
  R(/\b(good|bad|weak|poor|strong|excellent) in (maths?|english|hindi|science|history|geography|physics|chemistry|biology|studies|sports?|cooking|singing|dancing|drawing|painting|writing|speaking|languages?)\b/gi, '$1 at $2', 'We say "good at" a subject or skill.');
  R(/\binterested on\b/gi, 'interested in', 'We say "interested in".');
  R(/\b(depend)(s)? of\b/gi, (m, d, x) => d + (x || '') + ' on', 'We say "depend on".');
  R(/\bdiscuss about\b/gi, 'discuss', '"Discuss" does not need "about".');
  R(/\blisten (music|songs|radio)\b/gi, 'listen to $1', 'We say "listen to".');
  R(/\bmarried with\b/gi, 'married to', 'We say "married to".');
  R(/\bexplain me\b/gi, 'explain to me', 'We say "explain to me".');
  R(/\bI have (\d+) years?( old)?\b/g, 'I am $1 years old', 'Say "I am 20 years old" to give your age.');
  R(/\bsince (\d+|one|two|three|four|five|six|seven|eight|nine|ten) (years?|months?|weeks?|days?)\b/gi, 'for $1 $2', 'Use "for" with a length of time, "since" with a starting point.');
  R(/\bmuch people\b/gi, 'many people', 'Use "many" with people.');
  if (!spoken) R(/([.!?] )([a-z])/g, (m, a, b) => a + b.toUpperCase(), 'Start each sentence with a capital letter.');
  let f = s;
  const cap = f.charAt(0).toUpperCase() + f.slice(1);
  if (cap !== f) { if (!spoken) errs.push({ from: f.split(' ')[0], to: cap.split(' ')[0], why: 'Start a sentence with a capital letter.' }); f = cap; }
  if (!/[.!?]$/.test(f)) {
    const q = /^(what|where|when|why|how|who|which|do|does|did|can|could|will|would|is|are|am|have|has|should|may)\b/i.test(f), end = q ? '?' : '.';
    if (!spoken) errs.push({ from: f.split(' ').slice(-1)[0], to: f.split(' ').slice(-1)[0] + end, why: 'End the sentence with ' + (q ? 'a question mark.' : 'a full stop.') });
    f += end;
  }
  return { fixed: f, toks: diff(toks(text), toks(f)), errors: errs };
}

export function pronNotes(text, spoken, conf) {
  if (!spoken) return { tips: [], clarity: null };
  const tips = [...new Set(toks(text).map(nw))].filter((w) => HARD[w]).map((w) => `${w}: say "${HARD[w]}"`);
  const clarity = conf > 0 ? (conf >= 0.9 ? 'Very clear. The recogniser understood you easily.' : conf >= 0.75 ? 'Mostly clear. Try slightly slower speech and clear word endings.' : 'Hard to catch in places. Speak slowly, one phrase at a time.') : null;
  return { tips, clarity };
}
export function evaluate(text, spoken, conf) {
  const f = fixText(text, spoken), p = pronNotes(text, spoken, conf);
  return { ...f, ...p, perfect: f.errors.length === 0 };
}

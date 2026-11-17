// Accent allowance for speaking practice.
// Speakers of the same language pronounce some sounds differently (Indian English "tink" for "think", Cockney "fink",
// Spanish speakers' "bery" for "very"). When the learner chooses their own accent, a heard word that matches one of the
// documented patterns for that accent counts as correct instead of as a mistake.
// These are common tendencies, not rules for every speaker, and the allowance only compares spellings of what was heard.
const R = (re, to, why) => ({ re, to, why });
const TH = (to, label) => R(/th/g, to, 'th often sounds like ' + label);
const VW = [R(/v/g, 'w', 'v and w can sound alike'), R(/w/g, 'v', 'v and w can sound alike')];
const LR = [R(/l/g, 'r', 'l and r can sound alike'), R(/r/g, 'l', 'l and r can sound alike')];
const HDROP = R(/^h/, '', 'the h at the start of a word is often dropped');

export const ACCENT_PROFILES = [
  { id: 'none', label: 'Standard (no accent allowance)', rules: [] },
  { id: 'en-IN', label: 'Indian English (Hindi, Marathi and other Indian first languages)', rules: [...VW, TH('t', 't'), TH('d', 'd')] },
  { id: 'en-IE', label: 'Irish English', rules: [TH('t', 't'), TH('d', 'd')] },
  { id: 'en-GB-S', label: 'South of England (Cockney, Estuary)', rules: [TH('f', 'f'), TH('v', 'v'), HDROP, R(/ing$/, 'in', 'the ending -ing is often said -in')] },
  { id: 'es', label: 'Spanish speaker', rules: [R(/v/g, 'b', 'b and v sound alike in Spanish'), R(/b/g, 'v', 'b and v sound alike in Spanish'), TH('t', 't'), TH('d', 'd'), TH('s', 's'), HDROP, R(/sh/g, 'ch', 'sh and ch can sound alike'), R(/ch/g, 'sh', 'sh and ch can sound alike'), R(/^s([^aeiou\s])/, 'es$1', 'Spanish adds a vowel before s + consonant')] },
  { id: 'fr', label: 'French speaker', rules: [HDROP, TH('z', 'z'), TH('s', 's'), TH('d', 'd')] },
  { id: 'de', label: 'German speaker', rules: [R(/w/g, 'v', 'w often sounds like v'), R(/v/g, 'f', 'v often sounds like f'), TH('s', 's'), TH('z', 'z'), TH('d', 'd'), R(/d$/, 't', 'a final d often sounds like t'), R(/b$/, 'p', 'a final b often sounds like p'), R(/g$/, 'k', 'a final g often sounds like k')] },
  { id: 'it', label: 'Italian speaker', rules: [HDROP, TH('t', 't'), TH('d', 'd')] },
  { id: 'nl', label: 'Dutch speaker', rules: [R(/w/g, 'v', 'w often sounds like v'), R(/v/g, 'f', 'v often sounds like f'), TH('t', 't'), TH('d', 'd')] },
  { id: 'pt', label: 'Portuguese speaker', rules: [TH('t', 't'), TH('d', 'd'), TH('f', 'f')] },
  { id: 'ar', label: 'Arabic speaker', rules: [R(/p/g, 'b', 'p and b can sound alike'), R(/b/g, 'p', 'p and b can sound alike'), R(/v/g, 'f', 'v often sounds like f'), TH('s', 's'), TH('z', 'z'), TH('t', 't')] },
  { id: 'zh', label: 'Mandarin speaker', rules: [...LR, TH('s', 's'), TH('z', 'z')] },
  { id: 'ja', label: 'Japanese speaker', rules: [...LR, R(/v/g, 'b', 'v often sounds like b'), TH('s', 's'), TH('z', 'z')] },
];

export const profileById = (id) => ACCENT_PROFILES.find((p) => p.id === id) || ACCENT_PROFILES[0];

const MAX = 120;
// Every spelling a word could be heard as under the rules, using one or two changes.
// Each variant remembers the first reason that produced it.
export function accentVariants(word, rules) {
  const out = new Map([[word, null]]);
  const step = (from) => {
    for (const [w] of from) for (const r of rules) {
      r.re.lastIndex = 0;
      if (!r.re.test(w)) continue;
      r.re.lastIndex = 0;
      const v = w.replace(r.re, r.to);
      if (v && !out.has(v) && out.size < MAX) out.set(v, out.get(w) || r.why);
    }
  };
  step([...out]); step([...out]);
  return out;
}

// Returns { why } when `heard` is an accepted accent variant of `target`, otherwise null.
export function accentMatch(profile, target, heard) {
  if (!profile || !profile.rules.length || !target || !heard || heard === target || heard.length < 2) return null;
  const why = accentVariants(target, profile.rules).get(heard);
  return why ? { why } : null;
}

// ---- the learner's own accent, remembered in this browser ----
const KEY = 'speakwise.myAccent';
const subs = new Set();
export const getMyAccent = () => { try { return profileById(localStorage.getItem(KEY)).id; } catch { return 'none'; } };
export const setMyAccent = (id) => { try { localStorage.setItem(KEY, id); } catch { /* storage unavailable */ } subs.forEach((f) => f(id)); };
export const onMyAccent = (fn) => { subs.add(fn); return () => subs.delete(fn); };

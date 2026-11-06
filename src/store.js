import { useState, useEffect, useCallback } from 'react';
const KEY = 'speakwise-v1';
// Local calendar date (YYYY-MM-DD). toISOString() is UTC, which would roll the day over at the wrong hour
// (for example 5:30 AM in India) and break streaks and the daily goal.
const pad = (n) => String(n).padStart(2, '0');
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayLocal = () => iso(new Date());
const daysFrom = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
const INIT = { xp: 0, streak: 0, last: null, lang: 'en', ui: 'en', known: 'en', target: 'en', mistakes: [], words: {}, done: {}, daily: { d: null, xp: 0 }, voice: { accent: 'en-US', style: 'w1', rate: 0.85, variety: true }, mute: false, present: false };
const GAP = [0, 1, 3, 7, 14]; // review gaps in days per box (simple Leitner scheme)

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const str = (v, d) => (typeof v === 'string' && v ? v : d);
// Merge saved or imported data over the defaults and repair wrong types, so a damaged save can never crash the app.
export function sanitize(d) {
  if (!isObj(d)) return INIT;
  const m = { ...INIT, ...d, voice: { ...INIT.voice, ...(isObj(d.voice) ? d.voice : {}) } };
  m.xp = Number.isFinite(m.xp) ? Math.max(0, m.xp) : 0;
  m.streak = Number.isFinite(m.streak) ? Math.max(0, m.streak) : 0;
  m.mistakes = Array.isArray(m.mistakes) ? m.mistakes.filter(isObj) : [];
  m.words = isObj(m.words) ? m.words : {};
  m.done = isObj(m.done) ? m.done : {};
  m.daily = isObj(m.daily) ? m.daily : { d: null, xp: 0 };
  if (!d.ui) { m.ui = str(d.lang, 'en'); m.known = str(d.lang, 'en'); } // older saves used one language setting
  m.ui = str(m.ui, 'en'); m.known = str(m.known, 'en'); m.target = str(m.target, 'en');
  return m;
}
function load() {
  try { return sanitize(JSON.parse(localStorage.getItem(KEY))); } catch { return INIT; }
}
export const levelOf = (xp) => Math.floor(xp / 100) + 1;

export function useStore() {
  const [s, setS] = useState(load);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage full or blocked */ } }, [s]);

  const award = useCallback((n, game) => setS((p) => {
    const t = todayLocal(), y = iso(daysFrom(-1));
    const streak = p.last === t ? p.streak : p.last === y ? p.streak + 1 : 1;
    return { ...p, xp: p.xp + n, streak, last: t, done: { ...p.done, [game]: (p.done[game] || 0) + 1 }, daily: { d: t, xp: (p.daily && p.daily.d === t ? p.daily.xp : 0) + n } };
  }), []);

  const addMistake = useCallback((bad, good, why) => setS((p) => {
    const i = p.mistakes.findIndex((m) => m.good === good && m.bad === bad);
    const list = [...p.mistakes];
    if (i >= 0) list[i] = { ...list[i], count: list[i].count + 1, date: todayLocal(), practised: false };
    else list.unshift({ bad, good, why, count: 1, date: todayLocal(), practised: false });
    return { ...p, mistakes: list.slice(0, 200) };
  }), []);

  const practised = useCallback((good) => setS((p) => ({ ...p, mistakes: p.mistakes.map((m) => m.good === good ? { ...m, practised: true } : m) })), []);

  const rateWord = useCallback((w, ok) => setS((p) => {
    const box = ok ? Math.min((p.words[w]?.box || 0) + 1, 4) : 0;
    return { ...p, words: { ...p.words, [w]: { box, due: iso(daysFrom(GAP[box])) } } };
  }), []);

  const set = useCallback((patch) => setS((p) => ({ ...p, ...patch })), []);

  const exportJson = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' }));
    a.download = 'speakwise-progress.json'; a.click();
  };
  const importJson = async (file) => {
    try {
      const d = JSON.parse(await file.text());
      const ok = Number.isFinite(d.xp) && Number.isFinite(d.streak) && Array.isArray(d.mistakes) && d.words && typeof d.words === 'object';
      if (!ok) return false;
      setS(sanitize(d)); return true;
    } catch { return false; }
  };
  const reset = () => setS(INIT);
  return { s, award, addMistake, practised, rateWord, set, exportJson, importJson, reset };
}

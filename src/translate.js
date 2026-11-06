// Translation engine. Order of attempts (first that works wins):
// 1. your saved corrections  2. the offline phrasebook  3. Chrome's on-device translator (works offline once a pack is downloaded)
// 4. the free MyMemory online service (sends the text over the internet; can be switched off).
import { phraseSet, LANGS } from './langs.js';

const HKEY = 'speakwise-translations', CKEY = 'speakwise-corrections';
const rd = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v === null || v === undefined ? d : v; } catch { return d; } };
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full or blocked */ } };
export const loadHistory = () => { const h = rd(HKEY, []); return Array.isArray(h) ? h : []; };
export const saveHistory = (h) => wr(HKEY, h.slice(-200));
const norm = (t) => t.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!?。！？¿¡,]+$/u, '');
const ckey = (f, t, x) => `${f}>${t}|${norm(x)}`;
export const addCorrection = (f, t, x, y) => { const c = rd(CKEY, {}); c[ckey(f, t, x)] = y; wr(CKEY, c); mem.set(ckey(f, t, x), { text: y, via: 'correction' }); };
const API = (l) => (l === 'hing' ? 'hi' : l);
const MM = (l) => (API(l) === 'zh' ? 'zh-CN' : API(l));
const mem = new Map();

function fromPhrasebook(text, from, to) {
  if (from === 'auto' || !LANGS.concat([{ id: 'hing' }]).some((l) => l.id === from) || !LANGS.concat([{ id: 'hing' }]).some((l) => l.id === to)) return null;
  const n = norm(text), A = phraseSet(from), i = A.findIndex((p) => norm(p) === n);
  return i >= 0 ? phraseSet(to)[i] : null;
}

// ---- Chrome built-in (on-device) translator ----
const devs = new Map();
export const deviceSupport = () => typeof Translator !== 'undefined';
export async function deviceAvailability(from, to) {
  if (!deviceSupport()) return 'unsupported';
  try { return await Translator.availability({ sourceLanguage: API(from), targetLanguage: API(to) }); } catch { return 'unavailable'; }
}
export async function prepareDevice(from, to, onProgress) {
  const tr = await Translator.create({ sourceLanguage: API(from), targetLanguage: API(to), monitor(m) { m.addEventListener('downloadprogress', (e) => onProgress && onProgress(e.loaded)); } });
  devs.set(API(from) + '>' + API(to), tr); return tr;
}
async function viaDevice(text, from, to) {
  if (!deviceSupport()) return null;
  const key = API(from) + '>' + API(to); let tr = devs.get(key);
  if (!tr) { if ((await deviceAvailability(from, to)) !== 'available') return null; tr = await prepareDevice(from, to); }
  return tr.translate(text);
}

// ---- online (MyMemory) ----
const decode = (s) => s.replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n)).replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
async function viaOnline(text, from, to) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;
  const parts = text.match(/[^.!?。！？]+[.!?。！？]*\s*/g) || [text], chunks = []; let cur = '';
  for (const p of parts) { if ((cur + p).length > 450 && cur) { chunks.push(cur); cur = p; } else cur += p; }
  if (cur) chunks.push(cur);
  const out = [];
  for (const c of chunks) {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 9000);
    try {
      const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(c.trim())}&langpair=${MM(from)}|${MM(to)}`, { signal: ctl.signal });
      const j = await r.json(), t = j && j.responseData && j.responseData.translatedText;
      if (!t || j.responseStatus !== 200 || /MYMEMORY WARNING|INVALID/i.test(t)) throw new Error('quota');
      out.push(decode(t));
    } finally { clearTimeout(timer); }
  }
  return out.join(' ');
}

export async function translate(text, from, to, opt = {}) {
  const t = (text || '').trim();
  if (!t) return { text: '', via: 'none' };
  if (from === to) return { text: t, via: 'same' };
  const key = ckey(from, to, t), c = rd(CKEY, {})[key];
  if (c) return { text: c, via: 'correction' };
  if (mem.has(key)) return mem.get(key);
  const p = fromPhrasebook(t, from, to);
  if (p) return { text: p, via: 'phrasebook' };
  let res = null;
  try { const d = await viaDevice(t, from, to); if (d) res = { text: d, via: 'device' }; } catch { /* try the next engine */ }
  if (!res && opt.online !== false) {
    try { const o = await viaOnline(t, from, to); if (o) res = { text: o, via: 'online' }; }
    catch (e) { return { text: '', via: 'none', error: e && e.message === 'quota' ? 'The free online translator reached its limit for now. Try later, or use Chrome with a downloaded offline pack.' : 'Online translation failed. Check your internet connection, or use Chrome with a downloaded offline pack.' }; }
  }
  if (!res) return { text: '', via: 'none', error: 'No translation engine is available. Connect to the internet, allow online translation, or download an offline pack in Chrome.' };
  mem.set(key, res); return res;
}

// ---- language detection (typed or recognised text) ----
const SW = { es: ' el la de que y en los una por ', fr: ' le la les des et est une pour ', de: ' der die das und ist nicht ein ', pt: ' o a de que não e uma para ', it: ' il la di che e non una per ', nl: ' de het een en niet ', tr: ' bir ve bu için ', id: ' yang dan di ini dengan ', en: ' the and is are to of you ' };
function guess(text) {
  const rx = [[/[\u0900-\u097F]/, 'hi'], [/[\u3040-\u30FF]/, 'ja'], [/[\u4E00-\u9FFF]/, 'zh'], [/[\uAC00-\uD7AF]/, 'ko'], [/[\u0400-\u04FF]/, 'ru'], [/[\u0980-\u09FF]/, 'bn'], [/[\u0B80-\u0BFF]/, 'ta']];
  for (const [r, l] of rx) if (r.test(text)) return l;
  if (/[\u0600-\u06FF]/.test(text)) return /[ٹڈڑںےگپچ]/.test(text) ? 'ur' : 'ar';
  if (/[ăâđêôơư]/i.test(text)) return 'vi';
  const w = ' ' + text.toLowerCase().replace(/[^\p{L}\s]/gu, ' ') + ' ';
  let best = 'en', top = 0;
  for (const [l, set] of Object.entries(SW)) { const n = set.trim().split(' ').filter((x) => w.includes(' ' + x + ' ')).length; if (n > top) { top = n; best = l; } }
  return best;
}
export async function detectLang(text) {
  if (typeof LanguageDetector !== 'undefined') {
    try {
      const d = await LanguageDetector.create(), r = await d.detect(text), tag = r && r[0] && r[0].detectedLanguage;
      const id = tag && tag.slice(0, 2).toLowerCase();
      if (id && LANGS.some((l) => l.id === id)) return { lang: id, confidence: r[0].confidence, via: 'device' };
    } catch { /* use the simple guess */ }
  }
  return { lang: guess(text), confidence: 0.5, via: 'guess' };
}

// Important words for Learning mode.
export function keyWords(text, lang, n = 4) {
  const loc = lang === 'hing' ? 'hi' : lang;
  const words = typeof Intl !== 'undefined' && Intl.Segmenter ? [...new Intl.Segmenter(loc, { granularity: 'word' }).segment(text)].filter((s) => s.isWordLike).map((s) => s.segment) : text.split(/\s+/);
  const uniq = [...new Set(words.map((w) => w.toLowerCase()))].filter((w) => w.length >= (/[\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/.test(w) ? 2 : 5) && !/^[\u3040-\u309F]{1,2}$/.test(w));
  return uniq.sort((a, b) => b.length - a.length).slice(0, n);
}

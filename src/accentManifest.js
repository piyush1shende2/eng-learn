// Loads public/accents/manifest.json once and shares it between the Accent Lab and the recordings player.
// The manifest is built by tools/build_accent_data.py. If it is missing, the app still works (computer voices + built-in explanations).
import { useEffect, useState } from 'react';
import { profileOfGroup } from './accentData.js';

const BASE = (import.meta.env && import.meta.env.BASE_URL) || '/';
export const accentUrl = (file) => BASE + 'accents/' + file;

let cache = null;
function normalise(m) {
  if (!m || !Array.isArray(m.groups)) return null;
  const groups = m.groups.filter((g) => g && Array.isArray(g.speakers) && g.speakers.some((s) => s.clips && s.clips.length));
  if (!groups.length) return null;
  const sources = Array.isArray(m.sources) ? m.sources : [{ name: m.source, license: m.license, credit: m.credit }];
  return { ...m, groups, sources };
}
export function loadAccents() {
  if (!cache) {
    cache = fetch(BASE + 'accents/manifest.json')
      .then((r) => (r.ok ? r.json() : null))
      .then(normalise)
      .catch(() => null);
  }
  return cache;
}
// undefined = still loading, null = nothing installed, object = ready
export function useAccents() {
  const [m, setM] = useState(undefined);
  useEffect(() => {
    let off = false;
    loadAccents().then((x) => { if (!off) setM(x); });
    return () => { off = true; };
  }, []);
  return m;
}

const esc = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Find a real recording of an accent profile (us, uk, ...) whose sentence contains the word. Short sentence clips are preferred.
export function findClip(man, profile, word) {
  if (!man) return null;
  const re = new RegExp('\\b' + esc(word) + '\\b', 'i');
  let best = null;
  for (const g of man.groups) {
    if (profileOfGroup(g) !== profile) continue;
    for (const s of g.speakers) {
      for (const c of s.clips) {
        if (c.text && re.test(c.text) && (!best || c.text.length < best.c.text.length)) best = { g, s, c };
      }
    }
  }
  return best;
}
// First clip of a learner-language group (for example Hindi speakers reading the English paragraph).
export function findL1Clip(man, l1) {
  if (!man) return null;
  const g = man.groups.find((x) => x.l1 === l1);
  if (!g) return null;
  const s = g.speakers.find((x) => x.clips && x.clips.length);
  return s ? { g, s, c: s.clips[0] } : null;
}

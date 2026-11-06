import { useEffect, useState } from 'react';

const BASE = (import.meta.env && import.meta.env.BASE_URL) || '/';
let cache = null;
export const voiceUrl = (f) => BASE + 'voices/' + f;
// Loads public/voices/manifest.json once (made by tools/build_voice_library.py). Resolves to null if it is missing.
export function loadVoices() {
  if (!cache) cache = fetch(BASE + 'voices/manifest.json').then((r) => r.json()).then((m) => (m && Array.isArray(m.libraries) && m.libraries.length ? m : null)).catch(() => null);
  return cache;
}
export function useVoices() {
  const [m, setM] = useState(undefined);
  useEffect(() => { let off = false; loadVoices().then((x) => { if (!off) setM(x); }); return () => { off = true; }; }, []);
  return m;
}

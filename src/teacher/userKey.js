// "Bring your own key": a visitor can paste their own Gemini API key so the teacher works on the live site.
// The key is kept in sessionStorage only: it never leaves the browser except in requests to Google, and the browser
// erases it by itself when the tab or window is closed. Nothing is written to localStorage, cookies or any server.
export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const SLOT = 'eng-learn.teacher.session';
const MAX_KEYS = 3;
let memory = null; // fallback when the browser blocks storage (the key then lasts until the page is reloaded)

const store = () => { try { return typeof sessionStorage !== 'undefined' ? sessionStorage : null; } catch { return null; } };

// Accepts one or more keys separated by spaces, commas or new lines. Forgives "GEMINI_API_KEY=..." and quotes.
export function parseKeys(text) {
  const keys = [];
  for (const raw of String(text ?? '').split(/[\s,;]+/)) {
    const token = raw.replace(/^[A-Za-z_][A-Za-z0-9_]*=/, '').replace(/^["'`]+|["'`]+$/g, '');
    if (!token) continue;
    if (!/^[A-Za-z0-9._-]{20,200}$/.test(token)) return { keys: [], error: 'That does not look like an API key. A key is one long line of letters and numbers (for example starting with AIza). Copy it again from Google AI Studio.' };
    if (!keys.includes(token)) keys.push(token);
  }
  if (!keys.length) return { keys: [], error: 'Please paste your API key first.' };
  return { keys: keys.slice(0, MAX_KEYS), error: '' };
}

export const cleanModel = (value) => { const m = String(value ?? '').trim().replace(/^models\//, ''); return /^[A-Za-z0-9._-]{3,60}$/.test(m) ? m : DEFAULT_MODEL; };

export function loadSession() {
  try {
    const raw = store() ? store().getItem(SLOT) : null;
    const data = raw ? JSON.parse(raw) : memory;
    if (data && Array.isArray(data.keys) && data.keys.length) return { keys: data.keys.filter((k) => typeof k === 'string'), model: cleanModel(data.model) };
  } catch { /* unreadable: treat as no key */ }
  return null;
}
export function saveSession({ keys, model }) {
  const data = { keys, model: cleanModel(model) };
  memory = data;
  try { store() && store().setItem(SLOT, JSON.stringify(data)); } catch { /* blocked: memory copy is used */ }
}
export function clearSession() {
  memory = null;
  try { store() && store().removeItem(SLOT); } catch { /* nothing to clear */ }
}

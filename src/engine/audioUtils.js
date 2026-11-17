// Pure audio helpers for the offline Whisper listener (no browser APIs, so they can be unit tested).
export const WHISPER_RATE = 16000;

// Joins recorded pieces into one new array (always a copy, so it can be handed to a worker).
export function concatChunks(chunks) {
  let n = 0;
  for (const c of chunks) n += c.length;
  const out = new Float32Array(n);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}

// Converts audio recorded at any sample rate (usually 44100 or 48000) to the 16 kHz Whisper expects.
// Averages the samples that fall inside each output sample, which is a simple low-pass filter.
export function resampleTo16k(data, srcRate) {
  if (!srcRate || srcRate === WHISPER_RATE) return data;
  const ratio = srcRate / WHISPER_RATE, n = Math.floor(data.length / ratio), out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s0 = Math.floor(i * ratio), s1 = Math.min(data.length, Math.max(s0 + 1, Math.ceil((i + 1) * ratio)));
    let sum = 0;
    for (let k = s0; k < s1; k++) sum += data[k];
    out[i] = sum / (s1 - s0);
  }
  return out;
}

export function rms(a) {
  if (!a.length) return 0;
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * a[i];
  return Math.sqrt(s / a.length);
}
// Whisper invents words ("Thank you.") when it is fed silence, so near-silent audio is never sent to it.
export const isSilent = (a, thr = 0.004) => rms(a) < thr;

// Language codes Whisper knows. Anything else is left for Whisper to detect by itself.
const WHISPER_LANGS = new Set('en es fr de it pt nl ru ja ko zh hi ar tr vi id bn mr ta ur pl uk cs sv fi el he th ro hu da no ca fa ms te kn gu pa ne sw'.split(' '));
export function whisperLang(bcp) {
  const l = String(bcp || 'en').toLowerCase().split(/[-_]/)[0];
  return WHISPER_LANGS.has(l) ? l : undefined;
}

const GHOST = /^(thank you\.?|thanks for watching\.?|thanks\.?|you\.?|bye\.?|\.+)$/i;
// Removes non-speech tags such as [BLANK_AUDIO] or (music) and the usual silence hallucinations.
export function cleanText(t, quiet) {
  const s = String(t || '').replace(/\[[^\]]*\]|\((?:music|applause|laughter|silence|noise)[^)]*\)/gi, ' ').replace(/\s+/g, ' ').trim();
  return quiet && GHOST.test(s) ? '' : s;
}

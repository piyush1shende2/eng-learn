// Offline speech recognition with Whisper. It keeps the same shape as the browser recogniser
// (onText / onEnd / onError / stop) so the rest of the app does not need to change.
import { concatChunks, resampleTo16k, isSilent, rms, whisperLang, cleanText } from './audioUtils.js';

const BASE = (import.meta.env && import.meta.env.BASE_URL) || '/';
const abs = (p) => new URL(BASE + p, document.baseURI).href;
// Two sizes of Whisper. "small" understands accents and unclear speech noticeably better but is bigger and slower.
// local = folder inside public/models (used on localhost); remote = downloaded once from Hugging Face when there is no local copy.
export const STT_MODELS = {
  fast: { label: 'Fast (base, about 80 MB)', local: 'whisper-base', remote: 'onnx-community/whisper-base' },
  accurate: { label: 'Accurate (small, about 250 MB, better with accents)', local: 'whisper-small', remote: 'onnx-community/whisper-small' },
};
const MAX_SECONDS = 60;

export const WHISPER_OK = typeof window !== 'undefined' && typeof Worker !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && !!window.AudioContext && typeof AudioWorkletNode !== 'undefined';

const readPref = () => { try { return localStorage.getItem('speakwise.stt') === 'browser' ? 'browser' : 'whisper'; } catch { return 'whisper'; } };
const readQuality = () => { try { return localStorage.getItem('speakwise.sttQuality') === 'accurate' ? 'accurate' : 'fast'; } catch { return 'fast'; } };
let status = { engine: readPref(), quality: readQuality(), state: 'idle', msg: '' }, failed = false;
const subs = new Set();
const setStatus = (p) => { status = { ...status, ...p }; subs.forEach((f) => f(status)); };
export const getSttStatus = () => status;
export const onSttStatus = (fn) => { subs.add(fn); return () => subs.delete(fn); };
export const setSttEngine = (engine) => { try { localStorage.setItem('speakwise.stt', engine); } catch { /* storage unavailable */ } setStatus({ engine }); if (engine === 'whisper') preloadStt(); };
export const setSttQuality = (quality) => {
  if (!STT_MODELS[quality] || quality === status.quality) return;
  try { localStorage.setItem('speakwise.sttQuality', quality); } catch { /* storage unavailable */ }
  try { worker && worker.terminate(); } catch { /* ignore */ }
  worker = null; ready = null; failed = false;
  pending.forEach((p) => p.reject(new Error('the model was changed'))); pending.clear();
  setStatus({ quality, state: 'idle', msg: '', source: undefined });
  preloadStt();
};
export const whisperEnabled = () => WHISPER_OK && status.engine === 'whisper' && !failed;

// ---- worker connection ----
let worker = null, ready = null, seq = 0;
const pending = new Map();
// True when the model folder in public/models really exists (a dev server answers missing files with a web page, so the type is checked too).
async function localModelExists(model) {
  try { const r = await fetch(abs('models/' + model + '/config.json'), { cache: 'no-store' }); return r.ok && /json/i.test(r.headers.get('content-type') || ''); } catch { return false; }
}
function boot() {
  if (ready) return ready;
  setStatus({ state: 'loading', msg: '' });
  const M = STT_MODELS[status.quality];
  ready = localModelExists(M.local).then((local) => new Promise((resolve, reject) => {
    setStatus({ source: local ? 'local' : 'remote' });
    try { worker = new Worker(new URL('./stt.worker.js', import.meta.url), { type: 'module' }); } catch (e) { reject(e); return; }
    worker.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'ready') { setStatus({ state: 'ready', msg: '' }); resolve(); }
      else if (m.type === 'error') reject(new Error(m.message));
      else if (m.type === 'result') { const p = pending.get(m.id); if (p) { pending.delete(m.id); if (m.error) p.reject(new Error(m.error)); else p.resolve(m.text); } }
    };
    worker.onerror = (e) => reject(new Error((e && e.message) || 'the speech worker stopped'));
    worker.postMessage({ type: 'init', remote: !local, model: local ? M.local : M.remote, modelBase: abs('models/'), ortBase: abs('ort/') });
  }));
  ready.catch((e) => {
    failed = true;
    setStatus({ state: 'error', msg: 'The speech model could not start (' + e.message + '). The browser recogniser is used instead.' });
    try { worker && worker.terminate(); } catch { /* ignore */ }
    worker = null;
  });
  return ready;
}
export const preloadStt = () => { if (whisperEnabled()) boot().catch(() => {}); };
function transcribe(audio, lang) {
  return new Promise((resolve, reject) => {
    const id = ++seq; pending.set(id, { resolve, reject });
    worker.postMessage({ type: 'run', id, audio, lang }, [audio.buffer]);
  });
}

// ---- microphone capture (raw samples, no recording is saved) ----
const WORKLET = "class R extends AudioWorkletProcessor{process(i){const c=i[0]&&i[0][0];if(c)this.port.postMessage(c.slice(0));return true}}registerProcessor('speakwise-rec',R)";

export function whisperListen({ lang = 'en-US', onText, onEnd, onError, fallback, ...rest }) {
  let stopped = false, ended = false, inner = null, isReady = false, busy = false, timer = null, total = 0, lastN = -1, lastText = '', rate = 48000, inflight = Promise.resolve();
  let stream = null, ctx = null;
  const chunks = [], wl = whisperLang(lang);
  const closeMic = () => {
    clearInterval(timer);
    try { stream && stream.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
    try { ctx && ctx.state !== 'closed' && ctx.close(); } catch { /* ignore */ }
  };
  const end = () => { if (ended) return; ended = true; closeMic(); onEnd && onEnd(); };

  const run = async () => {
    const a16 = resampleTo16k(concatChunks(chunks), rate);
    lastN = total;
    if (a16.length < 8000 || isSilent(a16)) { lastText = ''; return ''; }
    const q = rms(a16) < 0.012;
    lastText = cleanText(await transcribe(a16, wl), q);
    return lastText;
  };
  const tick = () => {
    if (stopped || busy || !isReady) return;
    if (total > rate * MAX_SECONDS) { ctl.stop(); return; }
    if (total - Math.max(lastN, 0) < rate * 0.9) return; // wait for about a second of new speech
    busy = true;
    inflight = run().then((t) => { if (!stopped) onText(t, 0); }).catch(() => {}).finally(() => { busy = false; });
  };
  const finish = async () => {
    try {
      await inflight;
      if (total !== lastN) { await boot(); lastText = await run(); }
      onText(lastText, 0);
    } catch { /* keep the last text */ }
    end();
  };

  const useFallback = (why) => {
    closeMic(); stopped = true;
    if (fallback) { try { inner = fallback({ lang, onText, onEnd, onError, ...rest }); } catch { onError && onError('start'); } } else { onError && onError(why); ended = true; }
  };

  (async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
      if (stopped) { end(); return; }
      ctx = new AudioContext(); rate = ctx.sampleRate;
      await ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' })));
      const src = ctx.createMediaStreamSource(stream), node = new AudioWorkletNode(ctx, 'speakwise-rec'), mute = ctx.createGain();
      mute.gain.value = 0;
      node.port.onmessage = (e) => { if (!stopped) { chunks.push(e.data); total += e.data.length; } };
      src.connect(node); node.connect(mute); mute.connect(ctx.destination);
      timer = setInterval(tick, 600);
      boot().then(() => { isReady = true; }, () => { if (!stopped) useFallback('whisper-load'); });
    } catch (e) {
      const n = e && e.name;
      if (n === 'NotAllowedError' || n === 'SecurityError') { onError && onError('not-allowed'); ended = true; closeMic(); }
      else if (n === 'NotFoundError' || n === 'OverconstrainedError') { onError && onError('audio-capture'); ended = true; closeMic(); }
      else useFallback('whisper-load');
    }
  })();

  const ctl = { stop: () => { if (inner) return inner.stop(); if (stopped) return; stopped = true; closeMic(); finish(); } };
  return ctl;
}

// Text recognition (OCR) with tesseract.js, loaded only when you scan something.
// Everything (worker, WASM core, language data) is bundled in /public/ocr, so scanning works offline.
// Override with VITE_OCR_LANG_PATH / VITE_OCR_WORKER_PATH / VITE_OCR_CORE_PATH to host it elsewhere.
const OCR = { en: 'eng', hi: 'hin', mr: 'mar', ja: 'jpn', zh: 'chi_sim', es: 'spa', fr: 'fra', de: 'deu', ru: 'rus', ko: 'kor', ar: 'ara', pt: 'por', it: 'ita', bn: 'ben', ur: 'urd', tr: 'tur', nl: 'nld', ta: 'tam', id: 'ind', vi: 'vie' };
export const ocrCode = (l) => OCR[l === 'hing' ? 'hi' : l] || 'eng';

// Absolute URL for a bundled file (a worker resolves relative paths from its own location, not the page).
const local = (p) => new URL(p, document.baseURI).href;

let worker = null, cur = '';
export async function readText(source, lang, onProgress) {
  const { createWorker } = await import('tesseract.js');
  const code = ocrCode(lang) + (ocrCode(lang) === 'eng' ? '' : '+eng');
  if (!worker || cur !== code) {
    if (worker) await worker.terminate();
    const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};
    const opts = {
      logger: onProgress,
      workerPath: env.VITE_OCR_WORKER_PATH || local('ocr/worker.min.js'),
      corePath: env.VITE_OCR_CORE_PATH || local('ocr/core'),
      langPath: env.VITE_OCR_LANG_PATH || local('ocr/lang'),
    };
    worker = await createWorker(code, 1, opts);
    cur = code;
  }
  const { data } = await worker.recognize(source);
  return { text: (data.text || '').trim(), confidence: data.confidence };
}
export async function stopOcr() {
  if (worker) {
    const w = worker;
    worker = null;
    cur = '';
    try { await w.terminate(); } catch { /* ignore */ }
  }
}

// Runs Whisper in a background thread so the page never freezes while it listens.
// On localhost the model comes from public/models (no internet needed). On the GitHub link it is downloaded once from
// Hugging Face and kept in the browser, so later visits work offline too. The runtime files always come from this site (public/ort).
import { pipeline, env } from '@huggingface/transformers';

let asr = null;
const reply = (m) => self.postMessage(m);

async function init({ modelBase, model, ortBase, remote }) {
  env.allowRemoteModels = !!remote;
  env.allowLocalModels = !remote;
  env.useBrowserCache = !!remote;
  if (!remote) env.localModelPath = modelBase;
  const wasm = env.backends && env.backends.onnx && env.backends.onnx.wasm;
  if (wasm) {
    wasm.wasmPaths = ortBase; // onnxruntime files copied by scripts/copy-ort.mjs
    wasm.numThreads = self.crossOriginIsolated ? Math.min(4, self.navigator.hardwareConcurrency || 2) : 1;
  }
  // "q8" loads the *_quantized.onnx files (the small, fast version of the model).
  asr = await pipeline('automatic-speech-recognition', model, { dtype: 'q8', device: 'wasm' });
}

self.onmessage = async (e) => {
  const m = e.data;
  try {
    if (m.type === 'init') { await init(m); reply({ type: 'ready' }); }
    else if (m.type === 'run') {
      if (!asr) throw new Error('model not loaded');
      const out = await asr(m.audio, { language: m.lang, task: 'transcribe', chunk_length_s: 30, stride_length_s: 5 });
      reply({ type: 'result', id: m.id, text: (Array.isArray(out) ? out.map((x) => x.text).join(' ') : out.text) || '' });
    }
  } catch (err) {
    const message = (err && err.message) || String(err);
    if (m.type === 'run') reply({ type: 'result', id: m.id, error: message });
    else reply({ type: 'error', message });
  }
};

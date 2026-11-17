// Copies the onnxruntime-web runtime files (WebAssembly) into public/ort so Whisper can run with no internet.
// Runs automatically before "npm run dev" and "npm run build".
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const roots = [
  'node_modules/@huggingface/transformers/dist',
  'node_modules/@huggingface/transformers/node_modules/onnxruntime-web/dist',
  'node_modules/onnxruntime-web/dist',
];
const want = /^ort.*\.(wasm|mjs)$/;
const out = join('public', 'ort');
// Use the files of ONE package only, so the JavaScript and the WebAssembly are always the same version.
const root = roots.find((r) => existsSync(r) && readdirSync(r).some((f) => want.test(f)));
if (!root) {
  console.warn('[copy-ort] No onnxruntime files found. Run "npm install" first. Offline Whisper will fall back to the browser recogniser.');
  process.exit(0);
}
mkdirSync(out, { recursive: true });
let n = 0;
for (const f of readdirSync(root)) if (want.test(f)) { cpSync(join(root, f), join(out, f)); n++; }
console.log(`[copy-ort] Copied ${n} files from ${root} to ${out}`);

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// base './' lets the built site work on GitHub Pages sub-paths and from any folder.
// worker.format 'es' lets the Whisper background worker import the transformers library.
export default defineConfig({ plugins: [react()], base: './', worker: { format: 'es' } });

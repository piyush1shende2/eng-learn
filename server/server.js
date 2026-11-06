import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createApp } from './app.js';
import { KeyPool, loadKeys } from './keys.js';

// Always read server/.env, whichever folder the server is started from.
dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) });

const port = Number(process.env.PORT || 5000);
const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const origins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map((x) => x.trim()).filter(Boolean);
const pool = new KeyPool(loadKeys());

// Creates the streaming call for one key and yields the text pieces.
async function open(key, { model: modelId, contents, systemInstruction }) {
  const ai = new GoogleGenAI({ apiKey: key });
  const stream = await ai.models.generateContentStream({ model: modelId, contents, config: { systemInstruction, temperature: 0.65, maxOutputTokens: 700 } });
  return (async function* pieces() { for await (const chunk of stream) yield chunk.text || ''; })();
}

createApp({ pool, open, model, origins }).listen(port, () => {
  console.log(`Chat with teacher API listening at http://localhost:${port}`);
  console.log(`Model: ${model}`);
  console.log(`API keys loaded: ${pool.size}${pool.size > 1 ? ' (automatic failover is on: the next key takes over when one runs out of quota)' : ''}`);
  if (!pool.size) console.warn('No API key found. Add GEMINI_API_KEY_1 (and GEMINI_API_KEY_2) to server/.env before chatting.');
});

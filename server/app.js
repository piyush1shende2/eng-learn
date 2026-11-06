import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { parseChatRequest } from './prompt.js';
import { AllKeysFailed, streamWithFailover } from './keys.js';

// Builds the Express app. `open(key)` creates the Gemini stream for one API key, so tests can pass a fake.
export function createApp({ pool, open, model, origins, log = console.log }) {
  const app = express();
  app.set('trust proxy', 1); // behind Render/Railway etc. the real visitor address comes from the proxy (needed for the rate limit)
  app.use(cors({ origin: origins }));
  app.use(express.json({ limit: '32kb' }));
  app.use('/api/', rateLimit({ windowMs: 60_000, limit: 60 }));

  // Never returns key values: only how many keys exist and whether each one is ready.
  app.get('/api/health', (_req, res) => res.json({ ok: true, model, configured: pool.size > 0, keys: pool.size, ready: pool.availableCount(), status: pool.status() }));

  app.post('/api/chat', async (req, res) => {
    if (!pool.size) return res.status(500).json({ error: 'No Gemini API key found. Add GEMINI_API_KEY_1 (and GEMINI_API_KEY_2) to server/.env and restart the server.' });
    const parsed = parseChatRequest(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const { contents, systemInstruction } = parsed.value;

    let started = false;
    const write = (text) => {
      if (!started) {
        started = true;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.flushHeaders();
      }
      res.write(text);
    };
    try {
      await streamWithFailover({ pool, open: (key) => open(key, { model, contents, systemInstruction }), write, log: (m) => log(`[keys] ${m}`) });
      if (!started) write(''); // empty answer: still a valid, finished response
      res.end();
    } catch (error) {
      log('Gemini request failed:', error?.cause?.message || error?.message || error);
      if (started) { res.write('\n\n[Connection interrupted. Please try again.]'); return res.end(); }
      if (error instanceof AllKeysFailed) {
        const text = {
          quota: 'The AI teacher has used up the free quota on every API key for now. Please try again in a minute, or add another key in server/.env.',
          auth: 'Google rejected every API key (invalid, expired or restricted). Check the keys in server/.env and restart the server.',
          busy: 'Google’s AI service is very busy right now. Please try again in a moment.',
        }[error.kind] || 'The teacher could not reply just now. Check the server terminal for details.';
        return res.status(error.kind === 'quota' || error.kind === 'busy' ? 429 : 502).json({ error: text });
      }
      return res.status(502).json({ error: 'The teacher could not reply just now. Check the model ID in server/.env and the server terminal.' });
    }
  });

  return app;
}

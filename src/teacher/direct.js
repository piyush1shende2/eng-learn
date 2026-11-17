// Talks to Google Gemini straight from the visitor's browser, with the visitor's own API key.
// The prompt and the key-switching logic are shared with the server (server/prompt.js, server/keys.js).
import { parseChatRequest } from '../../server/prompt.js';
import { AllKeysFailed, KeyPool, streamWithFailover } from '../../server/keys.js';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const pools = new Map(); // remembers which of the visitor's keys are resting (kept in memory only)
const poolFor = (keys) => { const id = keys.join('|'); if (!pools.has(id)) pools.set(id, new KeyPool(keys)); return pools.get(id); };

// Turns a Server-Sent-Events body into the text pieces of the answer.
export async function* sseText(body) {
  const reader = body.getReader(), decoder = new TextDecoder();
  let buffer = '';
  const pieces = (block) => {
    const out = [];
    for (const line of block.split(/\r?\n/)) {
      if (!line.startsWith('data:')) continue;
      const json = line.slice(5).trim();
      if (!json || json === '[DONE]') continue;
      try { for (const part of JSON.parse(json)?.candidates?.[0]?.content?.parts || []) if (typeof part.text === 'string' && !part.thought) out.push(part.text); } catch { /* ignore a broken line */ }
    }
    return out;
  };
  for (;;) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const blocks = buffer.split(/\r?\n\r?\n/); buffer = blocks.pop();
    for (const block of blocks) yield* pieces(block);
    if (done) { yield* pieces(buffer); return; }
  }
}

const FRIENDLY = {
  quota: 'Your API key has used up its free quota for now. Wait a minute and try again, or add a second key.',
  auth: 'Google rejected this API key (invalid, expired or restricted). Remove it and paste a fresh key from Google AI Studio.',
  busy: 'Google’s AI service is very busy right now. Please try again in a moment.',
};

/**
 * Same contract as streamChat in transport.js, but the request goes from the browser to Google directly.
 * @param keys  the visitor's key(s); @param model  Gemini model name
 */
export async function streamDirect(payload, keys, model, onText, signal) {
  const parsed = parseChatRequest(payload);
  if (parsed.error) throw new Error(parsed.error);
  const { contents, systemInstruction, generation } = parsed.value;
  let answer = '';
  const open = async (key) => {
    let response;
    try {
      response = await fetch(`${ENDPOINT}/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, {
        method: 'POST', signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: systemInstruction }] }, generationConfig: generation }),
      });
    } catch (e) {
      if (e && e.name === 'AbortError') throw e;
      throw Object.assign(new Error('Could not reach Google. Check your internet connection.'), { status: 503 });
    }
    if (!response.ok) { const text = await response.text().catch(() => ''); throw Object.assign(new Error(text.slice(0, 600) || `HTTP ${response.status}`), { status: response.status }); }
    if (!response.body) throw new Error('Streaming is not supported by this browser connection.');
    return sseText(response.body);
  };
  try {
    await streamWithFailover({ pool: poolFor(keys), open, write: (piece) => { answer += piece; onText(answer); } });
  } catch (error) {
    if (error && error.name === 'AbortError') throw error;
    if (error instanceof AllKeysFailed) throw new Error(FRIENDLY[error.kind] || 'The teacher could not reply just now. Check the model name under “Advanced” and try again.');
    if (/not found|NOT_FOUND|404/.test(String(error?.message)) ) throw new Error('Google does not know this model name. Open “Advanced” in the key box and use a model such as gemini-2.5-flash.');
    throw new Error('The teacher could not reply just now. Please try again.');
  }
  return answer;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseKeys, cleanModel, loadSession, saveSession, clearSession, DEFAULT_MODEL } from '../src/teacher/userKey.js';
import { sseText, streamDirect } from '../src/teacher/direct.js';

const K1 = 'AIzaFAKEKEYFAKEKEYFAKEKEY0001', K2 = 'AIzaFAKEKEYFAKEKEYFAKEKEY0002';

test('parseKeys accepts one or more keys and forgives pasted extras', () => {
  assert.deepEqual(parseKeys(`  ${K1}  `), { keys: [K1], error: '' });
  assert.deepEqual(parseKeys(`GEMINI_API_KEY="${K1}"\n${K2}, ${K1}`).keys, [K1, K2]);
  assert.match(parseKeys('').error, /paste/i);
  assert.match(parseKeys('hello world').error, /does not look like/);
  assert.match(parseKeys(`${K1} <script>`).error, /does not look like/);
  assert.equal(parseKeys(`${K1} ${K2} ${K1}x ${K2}y`).keys.length, 3); // at most 3 keys are kept
});

test('model names are cleaned', () => {
  assert.equal(cleanModel('models/gemini-2.5-flash'), 'gemini-2.5-flash');
  assert.equal(cleanModel('bad name!'), DEFAULT_MODEL); assert.equal(cleanModel(''), DEFAULT_MODEL);
});

test('the key is kept in sessionStorage only (erased by the browser with the tab), never in localStorage', () => {
  const data = new Map(), touched = [];
  globalThis.sessionStorage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: (k) => data.delete(k) };
  globalThis.localStorage = new Proxy({}, { get: (_t, name) => { touched.push(name); return () => { throw new Error('localStorage must not be used'); }; } });
  try {
    assert.equal(loadSession(), null);
    saveSession({ keys: [K1], model: 'models/gemini-x1' });
    assert.deepEqual(loadSession(), { keys: [K1], model: 'gemini-x1' });
    clearSession();
    assert.equal(loadSession(), null); assert.equal(data.size, 0);
    assert.deepEqual(touched, []);
  } finally { delete globalThis.sessionStorage; delete globalThis.localStorage; }
});

const stream = (...chunks) => new ReadableStream({ start(c) { chunks.forEach((x) => c.enqueue(new TextEncoder().encode(x))); c.close(); } });
const event = (text) => `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] })}\r\n\r\n`;

test('sseText reads Gemini events even when they are split across chunks, and skips thought parts', async () => {
  const ev = event('Hel') + event('lo ') + `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: 'hidden', thought: true }, { text: 'world' }] } }] })}\n\n`;
  const cut = Math.floor(ev.length / 3);
  const out = []; for await (const t of sseText(stream(ev.slice(0, cut), ev.slice(cut, cut * 2), ev.slice(cut * 2)))) out.push(t);
  assert.equal(out.join(''), 'Hello world');
});

test('streamDirect talks to Google only, keeps the key out of the URL, and switches to the backup key', async () => {
  const calls = [], realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), key: init.headers['x-goog-api-key'], body: JSON.parse(init.body) });
    if (init.headers['x-goog-api-key'] === K1) return new Response('{"error":{"code":429,"status":"RESOURCE_EXHAUSTED","message":"quota"}}', { status: 429 });
    return new Response(stream(event('<level=Beginner> Hi'), event(' there')), { status: 200 });
  };
  try {
    const seen = [];
    const answer = await streamDirect({ message: 'Beginner', practiceLanguage: 'French', replyLanguage: 'English' }, [K1, K2], 'gemini-test', (t) => seen.push(t));
    assert.equal(answer, '<level=Beginner> Hi there'); assert.equal(seen.at(-1), answer);
    assert.deepEqual(calls.map((c) => c.key), [K1, K2]);
    assert.ok(calls.every((c) => c.url.startsWith('https://generativelanguage.googleapis.com/') && c.url.includes('gemini-test') && !c.url.includes('AIza')));
    assert.ok(calls[0].body.systemInstruction.parts[0].text.includes('Fluent')); assert.equal(calls[0].body.contents.at(-1).role, 'user');
  } finally { globalThis.fetch = realFetch; }
});

test('streamDirect explains bad keys and exhausted quota in plain words', async () => {
  const realFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('{"error":{"code":400,"message":"API key not valid. Please pass a valid API key.","status":"INVALID_ARGUMENT"}}', { status: 400 });
    await assert.rejects(streamDirect({ intro: true }, ['AIzaBADBADBADBADBADBAD0001'], 'm', () => {}), /rejected this API key/);
    globalThis.fetch = async () => new Response('{"error":{"status":"RESOURCE_EXHAUSTED","message":"quota"}}', { status: 429 });
    await assert.rejects(streamDirect({ intro: true }, ['AIzaQUOTAQUOTAQUOTAQUOTA01'], 'm', () => {}), /free quota/);
    globalThis.fetch = async () => { throw new TypeError('network down'); };
    await assert.rejects(streamDirect({ intro: true }, ['AIzaNETNETNETNETNETNETN01'], 'm', () => {}), /busy|try again/i);
    await assert.rejects(streamDirect({ message: '' }, [K1], 'm', () => {}), /enter or speak/);
  } finally { globalThis.fetch = realFetch; }
});

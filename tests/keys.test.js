import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { loadKeys, classifyError, KeyPool, streamWithFailover, AllKeysFailed } from '../server/keys.js';

const quota = (extra = '') => Object.assign(new Error(`{"error":{"code":429,"status":"RESOURCE_EXHAUSTED","message":"You exceeded your current quota ${extra}"}}`), { status: 429 });
async function* pieces(...p) { for (const x of p) yield x; }

test('loadKeys reads numbered keys first, then the list and single-key forms, without duplicates', () => {
  assert.deepEqual(loadKeys({ GEMINI_API_KEY_2: 'b', GEMINI_API_KEY_1: ' a ', GEMINI_API_KEY: 'a', GEMINI_API_KEY_3: '' }), ['a', 'b']);
  assert.deepEqual(loadKeys({ GEMINI_API_KEYS: 'x, y ,,z', GEMINI_API_KEY: 'w' }), ['x', 'y', 'z', 'w']);
  assert.deepEqual(loadKeys({}), []);
});

test('classifyError tells quota, rejected key, busy server and other errors apart', () => {
  assert.equal(classifyError(quota()).type, 'quota');
  assert.equal(classifyError(quota()).cooldownMs, 60_000);
  assert.equal(classifyError(quota('"retryDelay":"34s"')).cooldownMs, 35_000);
  assert.equal(classifyError(quota('PerDay limit')).cooldownMs, 3_600_000);
  assert.equal(classifyError(Object.assign(new Error('API key expired. Please renew the API key.'), { status: 400 })).type, 'auth');
  assert.equal(classifyError({ status: 403, message: 'PERMISSION_DENIED' }).type, 'auth');
  assert.equal(classifyError({ status: 503, message: 'UNAVAILABLE' }).type, 'busy');
  assert.deepEqual([classifyError({ status: 400, message: 'bad request' }).type, classifyError({ status: 404, message: 'model not found' }).failover], ['other', false]);
});

test('failover: when key 1 is out of quota, key 2 answers and key 1 rests', async () => {
  const pool = new KeyPool(['k1', 'k2']); const used = []; const out = [];
  const open = async (key) => { used.push(key); if (key === 'k1') throw quota(); return pieces('Hel', 'lo'); };
  const r = await streamWithFailover({ pool, open, write: (t) => out.push(t) });
  assert.deepEqual(used, ['k1', 'k2']); assert.equal(out.join(''), 'Hello'); assert.equal(r.keyLabel, 'key 2');
  used.length = 0; await streamWithFailover({ pool, open, write: () => {} }); // next request goes straight to key 2
  assert.deepEqual(used, ['k2']); assert.equal(pool.availableCount(), 1);
  assert.ok(JSON.stringify(pool.status()).indexOf('k1') === -1 || !/"k1"/.test(JSON.stringify(pool.status()))); // status never contains key values
});

test('failover also covers an error that arrives with the first chunk, and key 1 comes back after its rest', async () => {
  let clock = 0; const pool = new KeyPool(['k1', 'k2'], { now: () => clock }); const used = [];
  const open = async (key) => { used.push(key); if (key === 'k1' && clock < 100_000) return (async function* () { throw quota(); })(); return pieces('ok'); };
  await streamWithFailover({ pool, open, write: () => {} });
  assert.deepEqual(used, ['k1', 'k2']);
  clock = 120_000; used.length = 0; await streamWithFailover({ pool, open, write: () => {} });
  assert.deepEqual(used, ['k1']); // rest is over: primary key is used again
});

test('no failover after text was already sent, none for ordinary errors, and all keys failing is reported', async () => {
  const pool = new KeyPool(['k1', 'k2']);
  await assert.rejects(streamWithFailover({ pool, write: () => {}, open: async () => (async function* () { yield 'part'; throw quota(); })() }), /quota/);
  const pool2 = new KeyPool(['k1', 'k2']); let calls = 0;
  await assert.rejects(streamWithFailover({ pool: pool2, write: () => {}, open: async () => { calls++; throw Object.assign(new Error('bad request'), { status: 400 }); } }), /bad request/);
  assert.equal(calls, 1);
  const pool3 = new KeyPool(['k1', 'k2']); calls = 0;
  await assert.rejects(streamWithFailover({ pool: pool3, write: () => {}, open: async () => { calls++; throw quota(); } }), (e) => e instanceof AllKeysFailed && e.kind === 'quota');
  assert.equal(calls, 2);
  calls = 0; await assert.rejects(streamWithFailover({ pool: pool3, write: () => {}, open: async () => { calls++; throw quota(); } }), AllKeysFailed);
  assert.equal(calls, 2); // even when every key is resting each one is still tried once (a wrong rest estimate can't lock the app)
});

test('the API: key 1 exhausted -> the learner still gets the answer from key 2; health shows no secrets', async (t) => {
  let createApp; try { ({ createApp } = await import('../server/app.js')); } catch { t.skip('server dependencies are not installed (run npm install inside server/)'); return; }
  const pool = new KeyPool(['SECRET-ONE', 'SECRET-TWO']);
  const app = createApp({ pool, model: 'm', origins: ['http://localhost:5173'], log: () => {}, open: async (key) => { if (key === 'SECRET-ONE') throw quota(); return pieces('<level=Beginner> Hi', ' there'); } });
  const server = http.createServer(app); await new Promise((r) => server.listen(0, r)); const base = `http://localhost:${server.address().port}`;
  try {
    const chat = await fetch(`${base}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Beginner' }) });
    assert.equal(chat.status, 200); assert.equal(await chat.text(), '<level=Beginner> Hi there');
    const health = await (await fetch(`${base}/api/health`)).text();
    assert.ok(!health.includes('SECRET')); assert.equal(JSON.parse(health).keys, 2);
    const intro = await fetch(`${base}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ intro: true }) });
    assert.equal(intro.status, 200);
    const all = createApp({ pool: new KeyPool(['a']), model: 'm', origins: '*', log: () => {}, open: async () => { throw quota(); } });
    const s2 = http.createServer(all); await new Promise((r) => s2.listen(0, r));
    const bad = await fetch(`http://localhost:${s2.address().port}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'hi' }) });
    assert.equal(bad.status, 429); assert.match((await bad.json()).error, /used up the free quota/); s2.close();
  } finally { server.close(); }
});

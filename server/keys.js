// API key pool with automatic failover. No network, no dependencies, so it can be unit-tested.
//
// Put your keys in server/.env as GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_3 ... (up to 10).
// The server always tries key 1 first. When Google answers "quota used up" (or "key rejected") for a key, that
// key is put to rest for a while and the same request is retried on the next key, so the learner never notices.
// Key 1 is used again automatically as soon as its rest period is over.
// Older setups still work: GEMINI_API_KEY (one key) or GEMINI_API_KEYS (comma separated list).

export function loadKeys(env = process.env) {
  const keys = [];
  const add = (value) => { const key = String(value ?? '').trim(); if (key && !keys.includes(key)) keys.push(key); };
  for (let i = 1; i <= 10; i++) add(env[`GEMINI_API_KEY_${i}`]);
  String(env.GEMINI_API_KEYS ?? '').split(',').forEach(add);
  add(env.GEMINI_API_KEY);
  return keys;
}

const MINUTE = 60_000;

// Decides what a failed Gemini call means. failover=true means "try the next key".
export function classifyError(error) {
  const status = Number(error?.status ?? error?.code ?? error?.error?.code) || 0;
  const text = `${error?.message ?? ''} ${error?.statusText ?? ''}`;
  if (status === 401 || status === 403 || /API_KEY_INVALID|API key (not valid|expired)|key (has )?expired|PERMISSION_DENIED|UNAUTHENTICATED|API key.*(invalid|revoked)/i.test(text)) {
    return { type: 'auth', failover: true, cooldownMs: 60 * MINUTE };
  }
  if (status === 429 || /RESOURCE_EXHAUSTED|quota|rate.?limit|too many requests/i.test(text)) {
    if (/per.?day|daily|PerDay/i.test(text)) return { type: 'quota', failover: true, cooldownMs: 60 * MINUTE }; // daily limit: check again in an hour
    const hint = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(text) || /retry in (\d+(?:\.\d+)?)s/i.exec(text);
    const wait = hint ? Math.ceil(Number(hint[1]) * 1000) + 1000 : MINUTE;
    return { type: 'quota', failover: true, cooldownMs: Math.min(Math.max(wait, 15_000), 60 * MINUTE) };
  }
  if ([500, 502, 503, 504].includes(status) || /UNAVAILABLE|overloaded|high demand|temporarily/i.test(text)) {
    return { type: 'busy', failover: true, cooldownMs: 20_000 };
  }
  return { type: 'other', failover: false, cooldownMs: 0 };
}

export class KeyPool {
  constructor(keys, { now = Date.now } = {}) {
    this.now = now;
    this.entries = keys.map((key, index) => ({ key, label: `key ${index + 1}`, until: 0, reason: '' }));
  }
  get size() { return this.entries.length; }
  availableCount() { return this.entries.filter((e) => e.until <= this.now()).length; }
  // Order to try for one request: ready keys first (key 1 before key 2 ...), then resting keys, soonest-ready first,
  // so a wrong cool-down estimate can never lock the app out completely.
  order() {
    const t = this.now();
    const ready = this.entries.filter((e) => e.until <= t);
    const resting = this.entries.filter((e) => e.until > t).sort((a, b) => a.until - b.until);
    return [...ready, ...resting];
  }
  cool(entry, ms, reason) { entry.until = this.now() + ms; entry.reason = reason; }
  markWorked(entry) { entry.until = 0; entry.reason = ''; }
  // Safe to show anywhere: labels and timings only, never the keys themselves.
  status() {
    const t = this.now();
    return this.entries.map((e) => ({ label: e.label, ready: e.until <= t, retryInSeconds: e.until > t ? Math.ceil((e.until - t) / 1000) : 0, reason: e.reason }));
  }
}

export class AllKeysFailed extends Error {
  constructor(kind, cause) { super(`All API keys failed (${kind})`); this.kind = kind; this.cause = cause; }
}

/**
 * Runs one request, switching keys when a key is out of quota or rejected.
 * open(key)  -> returns an async iterable of text pieces (create the Gemini stream with that key)
 * write(txt) -> called for every text piece
 * Switching is only possible before the first piece was written. After that the error is passed on.
 */
export async function streamWithFailover({ pool, open, write, log = () => {} }) {
  let lastKind = 'other', lastError = null;
  for (const entry of pool.order()) {
    let wrote = false;
    try {
      const stream = await open(entry.key);
      for await (const piece of stream) { if (piece) { wrote = true; write(piece); } }
      pool.markWorked(entry);
      return { keyLabel: entry.label };
    } catch (error) {
      if (wrote) throw error;
      const verdict = classifyError(error);
      lastKind = verdict.type; lastError = error;
      if (!verdict.failover) throw error;
      pool.cool(entry, verdict.cooldownMs, verdict.type);
      log(`${entry.label}: ${verdict.type}, resting ${Math.round(verdict.cooldownMs / 1000)}s. Trying the next key.`);
    }
  }
  throw new AllKeysFailed(lastKind, lastError);
}

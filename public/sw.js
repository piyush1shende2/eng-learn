/* SpeakWise AI service worker: makes the app work offline after the first visit.
   - Page, scripts and styles: network first (so updates arrive), cached copy when offline.
   - Audio, OCR data, fonts and images: cache first (large, never change), stored the first time they are used.
   Nothing is stored until you use it, so low-storage devices are not filled up. */
const VERSION = 'speakwise-v2';
const RUNTIME = VERSION + '-runtime';
const MEDIA = VERSION + '-media';
const isMedia = (url) => !/\.json$/i.test(url.pathname) && (/\.(mp3|ogg|wav|m4a|traineddata\.gz|woff2?|png|jpe?g|svg|gif|webp)$/i.test(url.pathname) || /\/(ocr|voices|accents)\//.test(url.pathname));

self.addEventListener('install', (e) => { e.waitUntil(self.skipWaiting()); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Audio elements ask for byte ranges. Answer them from a fully cached file so offline playback and seeking work.
async function rangeResponse(request, cached) {
  const buf = await cached.arrayBuffer(), size = buf.byteLength, m = /bytes=(\d*)-(\d*)/.exec(request.headers.get('range') || '');
  if (!m) return cached;
  const start = m[1] ? parseInt(m[1], 10) : 0, end = m[2] ? Math.min(parseInt(m[2], 10), size - 1) : size - 1;
  return new Response(buf.slice(start, end + 1), { status: 206, headers: { 'Content-Type': cached.headers.get('Content-Type') || 'audio/mpeg', 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
}

async function media(request) {
  const cache = await caches.open(MEDIA), key = request.url;
  const hit = await cache.match(key);
  if (hit) return request.headers.has('range') ? rangeResponse(request, hit) : hit;
  if (request.headers.has('range')) { // first play: let the browser stream, and quietly store the whole file for next time
    fetch(key).then((r) => { if (r.ok) cache.put(key, r); }).catch(() => {});
    return fetch(request);
  }
  const res = await fetch(request);
  if (res.ok) cache.put(key, res.clone());
  return res;
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(request) || (request.mode === 'navigate' && await cache.match(new URL('./', self.location).href));
    if (hit) return hit;
    throw err;
  }
}

self.addEventListener('fetch', (e) => {
  const r = e.request, url = new URL(r.url);
  if (r.method !== 'GET' || url.origin !== self.location.origin || url.pathname.endsWith('/sw.js')) return;
  e.respondWith(isMedia(url) ? media(r) : networkFirst(r));
});

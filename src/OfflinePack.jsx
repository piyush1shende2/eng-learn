import { useState } from 'react';
import { loadAccents, accentUrl } from './accentManifest.js';

// Optional: download every real recording now, so it plays without internet later.
// The service worker (public/sw.js) stores each file the first time it is requested.
export default function OfflinePack() {
  const [st, setSt] = useState({ run: false, done: 0, total: 0, err: 0 });
  const supported = typeof caches !== 'undefined' && 'serviceWorker' in navigator;
  const go = async () => {
    const man = await loadAccents();
    if (!man) return;
    const files = man.groups.flatMap((g) => g.speakers.flatMap((s) => s.clips.map((c) => accentUrl(c.file))));
    setSt({ run: true, done: 0, total: files.length, err: 0 });
    let done = 0, err = 0;
    for (const f of files) { // one at a time: gentle on slow phones and slow networks
      try { const r = await fetch(f); if (!r.ok) err++; else await r.blob(); } catch { err++; }
      setSt({ run: true, done: ++done, total: files.length, err });
    }
    setSt({ run: false, done, total: files.length, err });
  };
  if (!supported) return null;
  const finished = !st.run && st.total > 0;
  return (<div className="card"><h3>📥 Save recordings for offline use</h3>
    <p className="muted">Optional. Downloads all accent recordings to this device once (a few tens of MB) so they work with no internet.</p>
    <button onClick={go} disabled={st.run}>{st.run ? `Saving… ${st.done}/${st.total}` : finished ? 'Save again' : 'Save for offline'}</button>
    {st.total > 0 && <progress max={st.total} value={st.done} aria-label="Download progress" />}
    {finished && <p className="fb ok" role="status">{st.err ? `Saved ${st.done - st.err} of ${st.total}. Some files could not be saved.` : `All ${st.total} recordings saved.`}</p>}
  </div>);
}

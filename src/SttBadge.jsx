import { useEffect, useState } from 'react';
import { WHISPER_OK, getSttStatus, onSttStatus, preloadStt, setSttEngine } from './engine/stt.js';

// Shows which listening engine is in use and lets the learner switch. Opening a speaking screen warms up the model.
export default function SttBadge() {
  const [st, setSt] = useState(getSttStatus());
  useEffect(() => { const off = onSttStatus(setSt); preloadStt(); return off; }, []);
  if (!WHISPER_OK) return null;
  const w = st.engine === 'whisper';
  return (<p className="muted" role="status">🎧 Listening engine: <b>{w ? 'Offline Whisper' : 'Browser recogniser'}</b>
    {w && st.state === 'loading' ? ' · loading the model (first time only)…' : ''}
    {w && st.state === 'ready' ? ' · ready, works without internet' : ''}
    {st.state === 'error' && st.msg ? ' · ' + st.msg : ''}{' '}
    <button type="button" className="ghost small" onClick={() => setSttEngine(w ? 'browser' : 'whisper')}>Switch to {w ? 'browser recogniser' : 'offline Whisper'}</button>
    {w ? <><br />Whisper understands accents better. Text appears every second or two instead of word by word.</> : null}</p>);
}

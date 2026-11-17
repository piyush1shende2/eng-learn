import { useEffect, useState } from 'react';
import { ACCENT_PROFILES, getMyAccent, onMyAccent, profileById, setMyAccent } from './engine/accent.js';

// "My accent" choice: words that match common patterns of that accent are not marked as mistakes.
export default function AccentProfile() {
  const [id, setId] = useState(getMyAccent());
  useEffect(() => onMyAccent(setId), []);
  const p = profileById(id);
  return (<p className="muted"><label>🗣 My accent{' '}
    <select value={id} onChange={(e) => setMyAccent(e.target.value)}>{ACCENT_PROFILES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select></label>
    {p.rules.length ? <><br />Words that match common patterns of this accent count as correct. They are listed after you check, so you can still work on a standard sound if you want to.</> : null}</p>);
}

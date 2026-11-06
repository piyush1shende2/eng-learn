import { useRef, useState } from 'react';
export default function Notebook({ ctx: { s, practised, award, exportJson, importJson, reset } }) {
  const [typed, setTyped] = useState({}), [msg, setMsg] = useState('');
  const file = useRef();
  const tryIt = (m) => {
    if ((typed[m.good] || '').trim().toLowerCase() === m.good.toLowerCase()) { practised(m.good); award(5, 'notebook'); setTyped({ ...typed, [m.good]: '' }); }
    else setMsg('Almost. Check the correct sentence and try again.');
  };
  return (<div className="card">
    <h3>Mistake notebook</h3>
    {s.mistakes.length === 0 && <p>Nothing here yet. Mistakes from your puzzles will appear here so you can practise them.</p>}
    {s.mistakes.map((m) => (<div key={m.bad + m.good} className="mistake">
      <p><s>{m.bad}</s> → <strong>{m.good}</strong> <span className="muted">(seen {m.count}x, {m.date}){m.practised ? ' ✓ practised' : ''}</span></p>
      <p className="muted">{m.why}</p>
      {!m.practised && <div className="row"><input aria-label="Type the correct sentence" value={typed[m.good] || ''} onChange={(e) => setTyped({ ...typed, [m.good]: e.target.value })} placeholder="Type the correct sentence" /><button onClick={() => tryIt(m)}>Practise</button></div>}
    </div>))}
    {msg && <p role="status" className="muted">{msg}</p>}
    <hr /><p className="muted">Your progress is saved only in this browser. Nothing is uploaded.</p>
    <div className="row"><button className="ghost" onClick={exportJson}>Export progress</button>
      <button className="ghost" onClick={() => file.current.click()}>Import progress</button>
      <button className="ghost" onClick={() => window.confirm('Delete all saved progress?') && reset()}>Delete all data</button></div>
    <input ref={file} type="file" accept="application/json" hidden onChange={async (e) => { const f = e.target.files[0]; if (f) setMsg((await importJson(f)) ? 'Progress imported.' : 'That file is not a valid SpeakWise export.'); e.target.value = ''; }} />
  </div>);
}

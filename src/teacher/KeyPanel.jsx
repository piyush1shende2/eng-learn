import { useState } from 'react';
import { DEFAULT_MODEL, cleanModel, parseKeys } from './userKey.js';

// "Add your API key" box of Chat with teacher. The key lives in this browser tab only (see userKey.js).
export default function KeyPanel({ active, needsKey, model, onSave, onRemove }) {
  const [main, setMain] = useState(''), [backup, setBackup] = useState(''), [modelName, setModelName] = useState(model || DEFAULT_MODEL);
  const [show, setShow] = useState(false), [error, setError] = useState('');

  if (active) {
    return (<div className="card"><h3>🔑 Using your own API key</h3>
      <p className="muted">Your key is kept only in this browser tab and is sent only to Google. It is erased when you close this tab or window.</p>
      <div className="row"><button className="ghost" onClick={onRemove}>🗑 Remove my key now</button></div></div>);
  }
  function submit(e) {
    e.preventDefault();
    const { keys, error: problem } = parseKeys(`${main}\n${backup}`);
    if (problem) { setError(problem); return; }
    setError(''); onSave(keys, cleanModel(modelName)); setMain(''); setBackup('');
  }
  const type = show ? 'text' : 'password';
  return (<div className="card">
    <details open={needsKey}>
      <summary><strong>🔑 {needsKey ? 'Add your API key to use the teacher' : 'Use my own API key instead'}</strong></summary>
      {needsKey && <p>The live demo has no shared teacher, so you bring your own <strong>free</strong> Google Gemini key. It takes about a minute, and then the chat starts working.</p>}
      <ol>
        <li>Open <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio → API keys</a> and sign in with your Google account.</li>
        <li>Click <em>Create API key</em> and copy it.</li>
        <li>Paste it below and press <em>Save and start</em>.</li>
      </ol>
      <form onSubmit={submit}>
        <label>API key<input type={type} value={main} onChange={(e) => setMain(e.target.value)} placeholder="Paste your key here" autoComplete="off" spellCheck="false" style={{ width: '100%' }} /></label>
        <label>Backup key (optional, used automatically if the first one runs out of quota)<input type={type} value={backup} onChange={(e) => setBackup(e.target.value)} placeholder="Second key (optional)" autoComplete="off" spellCheck="false" style={{ width: '100%' }} /></label>
        <label className="row"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show what I type</label>
        <details><summary className="muted">Advanced</summary>
          <label>Model name<input value={modelName} onChange={(e) => setModelName(e.target.value)} spellCheck="false" style={{ width: '100%' }} /></label>
          <p className="muted">Only change this if Google tells you the model does not exist.</p></details>
        {error && <p role="alert">⚠️ {error}</p>}
        <div className="row"><button type="submit" disabled={!main.trim()}>Save and start ➤</button></div>
      </form>
      <div className="note" role="note"><strong>🔒 How your key is handled</strong>
        <ul>
          <li>It stays <strong>only in this browser tab</strong>, on your own device. It is never sent to this website, to GitHub or to any server of ours.</li>
          <li>It is used only to send your messages <strong>straight from your browser to Google Gemini</strong>.</li>
          <li>It is <strong>erased automatically when you close the tab or window</strong>. Reloading keeps it so your chat doesn’t break. You can also press “Remove my key now” at any time.</li>
          <li>Tips: use a free key made just for this, avoid shared or public computers, and delete the key at aistudio.google.com/apikey whenever you like.</li>
          <li>Your messages are processed by Google under your key’s terms, so don’t type private information.</li>
        </ul></div>
    </details></div>);
}

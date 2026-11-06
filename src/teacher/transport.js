// Talks to the "Chat with teacher" backend (server/ folder) and streams the reply back piece by piece.
// Set VITE_TEACHER_API_URL when the backend is not at http://localhost:5000 (for example after deploying it).
const API_URL = ((import.meta.env && import.meta.env.VITE_TEACHER_API_URL) || 'http://localhost:5000').replace(/\/+$/, '');

// 'ready' = backend running and has an API key, 'nokey' = backend running but no key, 'offline' = cannot reach it.
export async function checkHealth() {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 6000);
  try {
    const response = await fetch(`${API_URL}/api/health`, { signal: ctl.signal });
    const data = await response.json();
    return data && data.ok ? (data.configured ? 'ready' : 'nokey') : 'offline';
  } catch { return 'offline'; } finally { clearTimeout(timer); }
}

/**
 * @param payload   { message, history, topic, level, practiceLanguage, accent, replyLanguage, replyAccent }
 * @param onText    called with the whole reply so far every time more text arrives
 * @param signal    optional AbortSignal (Start over / leaving the page cancels the request)
 * @returns         the complete reply text
 */
export async function streamChat(payload, onText, signal) {
  let response;
  try {
    response = await fetch(`${API_URL}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal });
  } catch (e) {
    if (e && e.name === 'AbortError') throw e;
    throw new Error('Cannot reach the teacher server. Start it with “npm start” in the server folder (see the README), then try again.');
  }
  if (!response.ok) {
    let message = 'Could not connect to the tutor.';
    try { message = (await response.json()).error || message; } catch { /* body was not JSON */ }
    throw new Error(message);
  }
  if (!response.body) throw new Error('Streaming is not supported by this connection.');
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let answer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    answer += decoder.decode(value, { stream: true });
    onText(answer);
  }
  return answer;
}

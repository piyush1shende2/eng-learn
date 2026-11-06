import { useEffect, useRef, useState } from 'react';

// Shows a live level meter so you can see whether the browser hears you.
// Note: browsers give web pages no gain control for speech recognition. To make the mic more sensitive,
// raise the input volume in your system sound settings.
export default function MicCheck() {
  const [on, setOn] = useState(false), [lvl, setLvl] = useState(0), [peak, setPeak] = useState(0), [msg, setMsg] = useState(''), [dev, setDev] = useState('');
  const st = useRef({});
  const stop = () => {
    cancelAnimationFrame(st.current.raf); clearTimeout(st.current.to);
    if (st.current.stream) st.current.stream.getTracks().forEach((t) => t.stop());
    try { st.current.ctx && st.current.ctx.close(); } catch { /* ignore */ }
    st.current = {}; setOn(false);
  };
  useEffect(() => () => stop(), []);
  const start = async () => {
    setMsg(''); setPeak(0);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setMsg('This page cannot reach the microphone. Open it at http://localhost:5173 in Chrome or Edge.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      const A = window.AudioContext || window.webkitAudioContext, ctx = new A(), an = ctx.createAnalyser(); an.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.fftSize); let pk = 0;
      st.current = { stream, ctx }; setDev((stream.getAudioTracks()[0] || {}).label || 'Default microphone'); setOn(true);
      const tick = () => {
        an.getByteTimeDomainData(buf); let m = 0; for (let i = 0; i < buf.length; i++) m = Math.max(m, Math.abs(buf[i] - 128));
        const p = Math.min(100, Math.round((m / 128) * 140)); pk = Math.max(pk, p); setLvl(p); setPeak(pk); st.current.raf = requestAnimationFrame(tick);
      };
      tick(); st.current.to = setTimeout(stop, 12000);
    } catch (e) {
      setMsg(e && e.name === 'NotFoundError' ? 'No microphone was found. Plug one in or check your system sound settings.' : 'The microphone is blocked. Click the lock icon in the address bar, allow the microphone, then try again.');
    }
  };
  const verdict = peak === 0 ? '' : peak < 8 ? 'Almost silent. Check that the right microphone is selected and not muted, then raise the Input volume in your system sound settings.' : peak < 25 ? 'Quiet. Move closer, speak up, or raise the Input volume in your system sound settings.' : peak <= 85 ? 'Good level. The browser can hear you.' : 'Very loud. Move a little back from the microphone.';
  return (<div className="micbox">
    <div className="row"><button className="ghost" onClick={on ? stop : start}>{on ? '⏹ Stop test' : '🎚 Test my microphone (12 seconds)'}</button>{dev && <span className="muted">Using: {dev}</span>}</div>
    <div className="meter" role="img" aria-label={`Microphone level ${lvl} percent`}><div style={{ width: lvl + '%' }} /></div>
    {on && <p className="muted">Say something now…</p>}
    {verdict && <p role="status">{verdict}</p>}{msg && <p className="fb no" role="alert">{msg}</p>}
    <p className="muted">Speech recognition uses your system's default microphone. Web pages cannot boost its gain, so if it is too quiet, raise the Input volume (Windows: Settings → System → Sound → Input) and use Chrome or Edge.</p>
  </div>);
}

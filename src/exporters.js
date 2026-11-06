// Offline exporters for a chat: PDF (hand-built, text only), Word (.doc via HTML) and plain text.
const DARK = [0.15, 0.2, 0.18], RED = [0.8, 0.1, 0.15], GREEN = [0.1, 0.5, 0.3], GREY = [0.4, 0.45, 0.42];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const stamp = () => new Date().toLocaleString();

export function save(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}
const mistakes = (msgs) => msgs.filter((m) => m.from === 'me').reduce((n, m) => n + m.ev.errors.length, 0);

export function toText(msgs) {
  const out = ['SpeakWise AI - Chat transcript', stamp(), ''];
  msgs.forEach((m) => {
    if (m.from === 'ai') out.push('Parrot (AI): ' + m.text);
    else {
      out.push(`You (${m.spoken ? 'spoken' : 'typed'}): ${m.text}`, '   Correct sentence: ' + m.ev.toks.map((x) => (x.bad ? `[${x.w}]` : x.w)).join(' '));
      m.ev.errors.forEach((e) => out.push(`   x ${e.from} -> ${e.to}: ${e.why}`));
      if (m.ev.clarity) out.push('   Clarity: ' + m.ev.clarity);
      m.ev.tips.forEach((t) => out.push('   Pronunciation tip - ' + t));
    }
    out.push('');
  });
  return out.join('\n');
}

export function toWordHtml(msgs) {
  const rows = msgs.map((m) => (m.from === 'ai'
    ? `<p><b style="color:#1f7a4d">Parrot (AI):</b> ${esc(m.text)}</p>`
    : `<p><b>You (${m.spoken ? 'spoken' : 'typed'}):</b> ${esc(m.text)}<br/><span style="color:#666">Correct sentence:</span> ${m.ev.toks.map((x) => (x.bad ? `<b style="color:#cc1a26;text-decoration:underline">${esc(x.w)}</b>` : esc(x.w))).join(' ')}<br/>`
      + (m.ev.errors.length ? m.ev.errors.map((e) => `<span style="color:#cc1a26">&#10007; ${esc(e.from)} &rarr; ${esc(e.to)}: ${esc(e.why)}</span><br/>`).join('') : '<span style="color:#1f7a4d">No mistakes found.</span><br/>')
      + (m.ev.clarity ? `<span style="color:#666">Clarity: ${esc(m.ev.clarity)}</span><br/>` : '') + m.ev.tips.map((t) => `<span style="color:#666">Pronunciation tip: ${esc(t)}</span><br/>`).join('') + '</p>')).join('');
  return `<html><head><meta charset="utf-8"><title>SpeakWise AI chat</title></head><body style="font-family:Calibri,Arial,sans-serif"><h1>SpeakWise AI - Chat transcript</h1><p>${esc(stamp())} - Mistakes found: ${mistakes(msgs)}</p>${rows}</body></html>`;
}

export function pdfLines(msgs) {
  const L = [{ segs: [{ t: 'SpeakWise AI - Chat transcript', b: true, c: DARK }], size: 18 }, { segs: [{ t: stamp(), c: GREY }], size: 10, before: 4 }, { segs: [{ t: `Mistakes found in your messages: ${mistakes(msgs)}`, c: DARK }], before: 6 }];
  msgs.forEach((m) => {
    if (m.from === 'ai') L.push({ segs: [{ t: 'Parrot (AI): ', b: true, c: GREEN }, { t: m.text, c: DARK }], before: 10 });
    else {
      L.push({ segs: [{ t: `You (${m.spoken ? 'spoken' : 'typed'}): `, b: true, c: DARK }, { t: m.text, c: DARK }], before: 10 });
      L.push({ segs: [{ t: 'Correct sentence: ', c: GREY }, ...m.ev.toks.map((x) => ({ t: x.w, c: x.bad ? RED : DARK, b: x.bad }))], indent: 14, before: 2 });
      m.ev.errors.forEach((e) => L.push({ segs: [{ t: `x ${e.from} -> ${e.to}: ${e.why}`, c: RED }], size: 10, indent: 14 }));
      if (!m.ev.errors.length) L.push({ segs: [{ t: 'No mistakes found.', c: GREEN }], size: 10, indent: 14 });
      if (m.ev.clarity) L.push({ segs: [{ t: 'Clarity: ' + m.ev.clarity, c: GREY }], size: 10, indent: 14 });
      m.ev.tips.forEach((t) => L.push({ segs: [{ t: 'Pronunciation tip - ' + t, c: GREY }], size: 10, indent: 14 }));
    }
  });
  return L;
}

const pe = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
// Minimal PDF writer: Helvetica text only (non-Latin characters become "?").
export function makePdf(lines) {
  const PW = 595, PH = 842, M = 50, pages = [[]]; let y = PH - M;
  for (const ln of lines) {
    const size = ln.size || 11, lead = size * 1.5, ind = ln.indent || 0;
    y -= ln.before || 0; if (y < M) { pages.push([]); y = PH - M; }
    let x = M + ind;
    for (const sg of ln.segs) for (const w0 of String(sg.t).replace(/[^\x20-\x7E]/g, '?').split(/\s+/).filter(Boolean)) {
      const wpx = w0.length * size * (sg.b ? 0.56 : 0.52);
      if (x + wpx > PW - M && x > M + ind) { x = M + ind; y -= lead; if (y < M) { pages.push([]); y = PH - M; } }
      pages[pages.length - 1].push(`BT /${sg.b ? 'F2' : 'F1'} ${size} Tf ${sg.c.join(' ')} rg ${x.toFixed(1)} ${y.toFixed(1)} Td (${pe(w0)} ) Tj ET`);
      x += wpx + size * 0.28;
    }
    y -= lead;
  }
  const objs = ['', '<< /Type /Catalog /Pages 2 0 R >>', `<< /Type /Pages /Kids [${pages.map((_, i) => `${5 + i * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'];
  pages.forEach((p, i) => {
    const c = p.join('\n');
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`, `<< /Length ${c.length} >>\nstream\n${c}\nendstream`);
  });
  let out = '%PDF-1.4\n'; const off = [0];
  for (let i = 1; i < objs.length; i++) { off.push(out.length); out += `${i} 0 obj\n${objs[i]}\nendobj\n`; }
  const xr = out.length;
  out += `xref\n0 ${objs.length}\n0000000000 65535 f \n` + off.slice(1).map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`;
  return out;
}
export const downloads = {
  pdf: (m) => save(new Blob([makePdf(pdfLines(m))], { type: 'application/pdf' }), 'speakwise-chat.pdf'),
  word: (m) => save(new Blob([toWordHtml(m)], { type: 'application/msword;charset=utf-8' }), 'speakwise-chat.doc'),
  text: (m) => save(new Blob([toText(m)], { type: 'text/plain;charset=utf-8' }), 'speakwise-chat.txt'),
};

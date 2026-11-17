// Tiny, safe formatter for the accent coach's answers: **bold**, *italic*, [[phrases]], "- " bullets, "1." lists and # headings.
// It only produces data (no HTML), so React can render it without any risk of injected markup. Pure, so it is unit-tested.

export function parseInline(text) {
  const s = String(text || ''), out = [];
  let buf = '', i = 0;
  const flush = () => { if (buf) { out.push({ t: 'text', v: buf }); buf = ''; } };
  while (i < s.length) {
    if (s.startsWith('[[', i)) { const j = s.indexOf(']]', i + 2); flush(); out.push({ t: 'phrase', v: j === -1 ? s.slice(i + 2) : s.slice(i + 2, j) }); i = j === -1 ? s.length : j + 2; continue; }
    if (s.startsWith('**', i)) { const j = s.indexOf('**', i + 2); flush(); out.push({ t: 'b', v: j === -1 ? s.slice(i + 2) : s.slice(i + 2, j) }); i = j === -1 ? s.length : j + 2; continue; }
    if (s[i] === '*' && s[i + 1] && s[i + 1] !== ' ' && s[i + 1] !== '*') {
      const j = s.indexOf('*', i + 1);
      if (j > i + 1 && s[j - 1] !== ' ') { flush(); out.push({ t: 'i', v: s.slice(i + 1, j) }); i = j + 1; continue; }
    }
    buf += s[i]; i++;
  }
  flush();
  return out.filter((x) => x.v !== '');
}

export function parseRich(text) {
  const blocks = [];
  let list = null;
  const close = () => { list = null; };
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) { close(); continue; }
    const head = /^#{1,4}\s+(.*)$/.exec(line), bullet = /^[-*•]\s+(.*)$/.exec(line), num = /^\d+[.)]\s+(.*)$/.exec(line);
    if (bullet || num) {
      const kind = bullet ? 'ul' : 'ol';
      if (!list || list.type !== kind) { list = { type: kind, items: [] }; blocks.push(list); }
      list.items.push(parseInline((bullet || num)[1]));
    } else { close(); blocks.push({ type: 'p', inline: head ? [{ t: 'b', v: head[1] }] : parseInline(line) }); }
  }
  return blocks;
}

// Pure helpers for "Chat with teacher" (no React, no browser globals, so they are unit-tested).

// When the reply language differs from the practice language the model wraps practice-language
// phrases as [[phrase]]. This splits a reply into plain pieces and highlighted phrase pieces.
export function splitReply(text) {
  const parts = [];
  let rest = text || '';
  while (rest.length) {
    const open = rest.indexOf('[[');
    if (open === -1) { parts.push({ phrase: false, text: rest }); break; }
    if (open > 0) parts.push({ phrase: false, text: rest.slice(0, open) });
    const close = rest.indexOf(']]', open + 2);
    if (close === -1) { parts.push({ phrase: true, text: rest.slice(open + 2) }); break; } // still streaming
    parts.push({ phrase: true, text: rest.slice(open + 2, close) });
    rest = rest.slice(close + 2);
  }
  return parts.filter((part) => part.text.trim() !== '' || !part.phrase);
}

export const cleanForSpeech = (text) => (text || '')
  .replace(/\[\[|\]\]/g, '')
  .replace(/\p{Extended_Pictographic}/gu, '')
  .replace(/[*_#`~]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

// Picks the installed voice that best matches an accent. Accents that share a locale (for example the
// Hindi regional accents) prefer different voices when the device has several.
export function pickVoice(accent, voices = []) {
  const wanted = accent.locale.toLowerCase(), prefix = wanted.split('-')[0];
  const norm = (v) => v.lang.replace('_', '-').toLowerCase();
  const exact = voices.filter((v) => norm(v) === wanted), sameLanguage = voices.filter((v) => norm(v).split('-')[0] === prefix);
  const pool = exact.length ? exact : sameLanguage;
  if (!pool.length) return { voice: null, poolSize: 0 };
  return { voice: pool[(accent.voiceSlot || 0) % pool.length], poolSize: pool.length };
}

// The teacher marks the learner's answers to the two opening questions with small tags at the start of a reply,
// for example <level=Beginner> or <scene=Job interview>. This removes the tags (also a half-streamed one) and reports them.
const LEVEL_NAMES = ['Beginner', 'Intermediate', 'Advanced'];
export function readTags(text) {
  let level = '', scene = '';
  let clean = (text || '').replace(/<(level|scene)=([^<>]{1,80})>/gi, (_all, kind, value) => {
    if (kind.toLowerCase() === 'level') level = LEVEL_NAMES.find((n) => n.toLowerCase() === value.trim().toLowerCase()) || level;
    else scene = value.trim().slice(0, 60) || scene;
    return '';
  });
  clean = clean.replace(/<(?:l|s)[a-z]*=?[^<>]{0,80}$/i, ''); // a tag that is still arriving
  return { text: clean.replace(/^\s+/, ''), level, scene };
}

// Finds a level word in what the learner typed or tapped.
export const guessLevel = (text) => { const m = /beginner|intermediate|advanced/i.exec(text || ''); return m ? LEVEL_NAMES.find((n) => n.toLowerCase() === m[0].toLowerCase()) : ''; };

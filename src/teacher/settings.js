// Chat with teacher takes its languages and accent from the main menu at the top of the app
// ("I know", "I want to learn", "Accent"), so there is only one place to set them.
// Pure functions (no React, no browser globals), so they are unit-tested.
import { accentsFor, langOf } from '../langs.js';

const EXPERIMENTAL = / \(experimental\)$/;
const HINGLISH = { id: 'hing', name: 'Hinglish (Hindi written in English letters)', native: 'Hinglish', rtl: false, bcp: 'en-IN' };

// [bcp-47 tag, label] pair from the menu -> everything the chat needs about one accent.
function describeAccent(language, [id, rawLabel]) {
  const approximate = EXPERIMENTAL.test(rawLabel), label = rawLabel.replace(EXPERIMENTAL, '');
  return {
    id, label, approximate,
    locale: id,                                  // voice used to read replies aloud
    listenLocale: approximate ? language.bcp : id, // language the microphone listens for
    ai: language.id === 'en' ? label : `${language.name} (${label})`, // how the accent is described to the AI
  };
}

/**
 * @param s  the app settings: { target, known, voice: { accent } }
 * @returns  { practice, accent, reply, replyAccent, sameLanguage, rtl, key }
 */
export function resolveTeacher(s = {}) {
  const targetId = s.target || 'en', knownId = s.known || 'en';
  const practice = langOf(targetId);
  const list = accentsFor(targetId);
  const accent = describeAccent(practice, list.find((a) => a[0] === (s.voice || {}).accent) || list[0]);
  const sameLanguage = knownId === targetId;
  let reply = practice, replyAccent = accent;
  if (!sameLanguage) {
    reply = knownId === 'hing' ? HINGLISH : langOf(knownId);
    replyAccent = knownId === 'hing'
      ? { id: 'en-IN', label: 'Indian', approximate: false, locale: 'en-IN', listenLocale: 'en-IN', ai: 'Hinglish as spoken in India' }
      : describeAccent(reply, accentsFor(knownId)[0]);
  }
  return { practice, accent, reply, replyAccent, sameLanguage, rtl: !!reply.rtl, key: `${practice.id}|${accent.id}|${reply.id}` };
}

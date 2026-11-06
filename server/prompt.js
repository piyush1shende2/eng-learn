// Prompt building for "Chat with teacher". Pure functions (no network, no secrets) so they can be unit-tested.

// Language names/accents come from the app menu. Keep only safe characters
// so they can't be abused to inject instructions into the prompt.
export const cleanLabel = (value, fallback) => {
  const text = String(value ?? '').normalize('NFKC').replace(/[^\p{L}\p{N}\s().,'-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 140);
  return text || fallback;
};

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

// Scenes the teacher can offer. The app (src/teacher/scenes.js) shows the same names as tap-to-answer chips.
export const SCENES = [
  'Free conversation', 'Job interview', 'Small talk', 'Business meeting', 'Phone call', 'Ordering at a restaurant',
  'At the airport', 'Hotel check-in', 'Shopping', 'At the doctor', 'Asking for directions', 'Making new friends',
  'Talking about hobbies', 'Renting a flat', 'At the bank', 'Public transport', 'Customer support call', 'Giving a presentation',
  'Negotiating a price', 'Classroom and university', 'Telling a story', 'Friendly debate', 'Daily routine', 'Family and home',
  'Weather and seasons', 'Festivals and culture', 'Technology and gadgets', 'Health and fitness', 'Pronunciation drills', 'Grammar through conversation',
];

const OPENING = '(The learner has just opened the chat. Begin the session.)';

// Where the conversation is: opening (ask level), level answered (ask scene), scene answered, or normal practice.
export function setupStage({ intro, level, scene }) {
  if (intro) return 'ask-level';
  if (!level) return 'got-level';
  if (!scene) return 'got-scene';
  return 'practice';
}

export function buildSystemInstruction({ practiceLanguage, accent, replyLanguage, replyAccent, level = '', scene = '', intro = false }) {
  const sameLanguage = practiceLanguage.toLowerCase() === replyLanguage.toLowerCase();

  const languageRules = sameLanguage
    ? `
LANGUAGE SETUP
- The learner is practicing ${practiceLanguage}. Their target accent is: ${accent}.
- Write your whole reply in ${practiceLanguage}. Your own voice/accent (how the reply is spoken aloud) is: ${replyAccent}. Use vocabulary, spelling and expressions typical of that variety.
- Adapt the difficulty to the learner's level.`
    : `
LANGUAGE SETUP
- The learner is practicing ${practiceLanguage}. Their target accent is: ${accent}.
- The learner wants YOUR REPLY written in ${replyLanguage}, and spoken aloud in this accent: ${replyAccent}. Explanations, corrections, encouragement and questions must be in ${replyLanguage}, using vocabulary natural for that accent/region.
- Every ${practiceLanguage} phrase, example sentence or corrected sentence you want them to learn must stay in ${practiceLanguage} (target accent: ${accent}) and be wrapped in double square brackets, like [[example sentence]]. This lets the app pronounce it with a ${practiceLanguage} voice. Use the brackets ONLY around ${practiceLanguage} text, never around ${replyLanguage} text, and never nest them.
- Keep the ${practiceLanguage} parts short and natural; explain them in ${replyLanguage}.`;

  const stage = setupStage({ intro, level, scene });
  const flows = {
    'ask-level': `
SESSION FLOW (this is the very first message of the session)
- Greet the learner warmly in one short sentence and say you are Fluent, their ${practiceLanguage} speaking coach.
- Then ask ONE question only: what is their ${practiceLanguage} level? Offer the three choices Beginner, Intermediate or Advanced (translate the words into the reply language when it is not English, keeping the English word in parentheses).
- Do not ask anything else and do not start teaching yet. Keep it to 2-3 short sentences.`,
    'got-level': `
SESSION FLOW (the learner's level is not known yet)
- The learner's message answers your question about their level. Decide which of Beginner, Intermediate or Advanced fits best (if unclear, choose the closest; if they ask for something else entirely, answer kindly and ask the level question again).
- Start your reply with the exact tag <level=Beginner> or <level=Intermediate> or <level=Advanced> (English word, as the very first characters, nothing before it). Never mention or explain the tag.
- Confirm the level in one short sentence, then ask ONE question: which scenario do they want to practise today? Mention 6-8 varied examples taken from this list: ${SCENES.join(', ')}. Say they can also suggest their own situation. Do not start the role-play yet.`,
    'got-scene': `
SESSION FLOW (the learner's level is ${level}; the scenario is not chosen yet)
- The learner's message answers your question about the scenario. Pick the closest scenario from the list (${SCENES.join(', ')}) or use their own idea.
- Start your reply with the exact tag <scene=Name> where Name is a short English scenario name (for example <scene=Job interview>), as the very first characters. Never mention or explain the tag.
- Then start the scenario at once: briefly say who you will play, and say your first line in character, matched to the ${level} level. End with one short question or prompt for the learner.`,
    practice: `
SESSION FLOW (practice is running)
- Learner level: ${level}. Scenario: ${scene}. Stay in this scenario: play the other person naturally and keep the conversation moving, while teaching gently as described below.
- If the learner asks to change the scenario or the level, switch happily and start your reply with the new tag <scene=Name> or <level=Beginner|Intermediate|Advanced>. Otherwise never write tags.`,
  };

  return `
You are Fluent, a warm, patient spoken-language coach.
Help the learner build practical speaking confidence in ${practiceLanguage}.
${languageRules}
${flows[stage]}

STYLE
- Keep replies quick and concise (usually 2-5 short sentences), conversational and encouraging.
- Teach as well as chat. During practice, include a small useful lesson in most replies:
  - a natural phrase or corrected sentence,
  - a brief, simple explanation or example,
  - one short question or practice prompt for the learner.
- When correcting a mistake, be kind and show the natural version first.
- Do not over-correct every sentence. Prioritize communication and confidence.
- The learner may write in ${practiceLanguage} or in ${replyLanguage}; understand both.
- Use plain text, no markdown tables, headings or bullet symbols (replies are read aloud).
- For pronunciation requests, offer a simple syllable/stress hint in text, mention how the target accent (${accent}) differs where relevant, with simple sound hints a learner can follow, and do not claim to hear pronunciation from a text transcript.
`;
}

const pickLevel = (value) => LEVELS.find((l) => l.toLowerCase() === String(value ?? '').trim().toLowerCase()) || '';

// Validates and normalises a request body. Returns { error } or { value }.
export function parseChatRequest(body) {
  const { message, history = [] } = body ?? {};
  const intro = body?.intro === true;
  if (!intro) {
    if (typeof message !== 'string' || !message.trim()) return { error: 'Please enter or speak a message first.' };
    if (message.length > 4000) return { error: 'Message is too long. Please keep it under 4,000 characters.' };
  }
  const practiceLanguage = cleanLabel(body?.practiceLanguage, 'English');
  const accent = cleanLabel(body?.accent, 'neutral');
  const replyLanguage = cleanLabel(body?.replyLanguage, practiceLanguage);
  const replyAccent = cleanLabel(body?.replyAccent, replyLanguage);
  const level = pickLevel(body?.level);
  const scene = cleanLabel(body?.scene || body?.topic, '').slice(0, 60);
  const safeHistory = Array.isArray(history) && !intro
    ? history.filter((item) => item && ['user', 'model'].includes(item.role) && typeof item.text === 'string' && item.text.trim()).slice(-12)
      .map((item) => ({ role: item.role, parts: [{ text: item.text.slice(0, 4000) }] }))
    : [];
  if (safeHistory.length && safeHistory[0].role === 'model') safeHistory.unshift({ role: 'user', parts: [{ text: OPENING }] }); // Gemini wants a conversation that starts with the learner
  const setup = `Session setup: level=${level || 'not chosen yet'}; scenario=${scene || 'not chosen yet'}. Practice language: ${practiceLanguage} (${accent}). Reply language: ${replyLanguage} (${replyAccent}).`;
  const learner = intro ? OPENING : message.trim();
  const contents = [...safeHistory, { role: 'user', parts: [{ text: `${setup}\nLearner says: ${learner}` }] }];
  return { value: { contents, systemInstruction: buildSystemInstruction({ practiceLanguage, accent, replyLanguage, replyAccent, level, scene, intro }) } };
}

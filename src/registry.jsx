import { Scramble, Builder, FindMistake } from './Games.jsx';
import { Quiz, OrderGame, WordSearch, Maze, sh } from './engine.jsx';
import { phraseSet } from './langs.js';
import { QUIZ } from './data2.js';

const q = (k, cat, emoji) => ({ id: k, title: QUIZ[k].title, cat, emoji, render: (ctx) => <Quiz key={k} spec={QUIZ[k]} ctx={ctx} /> });
export const CATS = ['Languages', 'Words', 'Grammar', 'Speaking', 'Logic'];
export const PUZZLES = [
  { id: 'scramble', title: 'Word scramble', cat: 'Words', emoji: '🔤', render: (c) => <Scramble ctx={c} /> },
  q('jumble', 'Words', '🍎'), q('cvc', 'Words', '🔔'), q('alpha', 'Words', '🅰️'), q('missing', 'Words', '🔡'), q('compound', 'Words', '🌻'),
  { id: 'wordsearch', title: 'Compound word search', cat: 'Words', emoji: '🔎', render: (c) => <WordSearch ctx={c} /> },
  q('train', 'Words', '🚂'), q('vocab', 'Words', '💼'),
  { id: 'builder', title: 'Sentence builder', cat: 'Grammar', emoji: '🧩', render: (c) => <Builder ctx={c} /> },
  { id: 'mistake', title: 'Find the correct sentence', cat: 'Grammar', emoji: '🦉', render: (c) => <FindMistake ctx={c} /> },
  q('tobe', 'Grammar', '✅'), q('present', 'Grammar', '⏰'), q('irregular', 'Grammar', '⏪'), q('fix', 'Grammar', '✏️'),
  q('qa', 'Speaking', '💬'),
  { id: 'phone', title: 'Phone call order', cat: 'Speaking', emoji: '📞', render: (c) => <OrderGame ctx={c} /> },
  { id: 'maze', title: 'Maze', cat: 'Logic', emoji: '🐿️', render: (c) => <Maze ctx={c} /> },
  q('parents', 'Logic', '🐣'), q('size', 'Logic', '🐘'),
];

// Phrase quizzes use the language you are learning and the language you know.
export const phrasePuzzles = (target, known) => {
  if (target === known) return [];
  const P = phraseSet(target), K = phraseSet(known), pick = (a, all) => [a, ...sh(all.filter((x) => x !== a)).slice(0, 2)];
  const mk = (id, title, intro, items) => { const spec = { id, title, mode: 'choice', intro, items }; return { id, title, cat: 'Languages', emoji: '🌍', render: (ctx) => <Quiz key={id + target + known} spec={spec} ctx={ctx} /> }; }; // spec is built once, so the quiz is not reshuffled when the app re-renders
  return [
    mk('ph-mean', 'Phrase → meaning', 'Pick the meaning of the phrase. Press the speaker to hear it.', P.map((p, i) => ({ e: '💬', q: p, say: true, o: pick(K[i], K), a: K[i], why: `${p} = ${K[i]}` }))),
    mk('ph-say', 'Meaning → phrase', 'Pick the phrase that matches the meaning.', K.map((k, i) => ({ e: '🗣️', q: k, o: pick(P[i], P), a: P[i], why: `${k} = ${P[i]}` }))),
  ];
};

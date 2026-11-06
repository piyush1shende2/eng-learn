import test from 'node:test';
import assert from 'node:assert/strict';
import { ACCENT_IDS, FEATURES, WORDS, L1, compareWord, overview, wordBy } from '../src/accentData.js';

test('every feature defines a group and an explanation for every accent', () => {
  for (const [id, F] of Object.entries(FEATURES)) {
    for (const a of ACCENT_IDS) {
      assert.ok(F.grp[a], `${id}: missing group for ${a}`);
      assert.ok(F.how[F.grp[a]], `${id}: no explanation for group "${F.grp[a]}" (${a})`);
    }
    assert.ok(F.title && F.tip && Number.isFinite(F.rank), `${id}: incomplete`);
  }
});

test('every word has IPA and a respelling for every accent, and only known features', () => {
  const seen = new Set();
  for (const w of WORDS) {
    assert.ok(!seen.has(w.word), 'duplicate word ' + w.word); seen.add(w.word);
    for (const a of ACCENT_IDS) { assert.ok(w.ipa[a], `${w.word}/${a} ipa`); assert.ok(w.say[a], `${w.word}/${a} say`); }
    for (const f of w.why) assert.ok(FEATURES[f], `${w.word}: unknown feature ${f}`);
    assert.ok(w.why.length > 0, `${w.word}: no features`);
  }
});

test('never claims a difference that the transcription does not show', () => {
  for (const w of WORDS) for (const a of ACCENT_IDS) for (const b of ACCENT_IDS) {
    if (a === b) continue;
    const c = compareWord(w.word, a, b);
    if (c.diffs.length) assert.notEqual(w.ipa[a], w.ipa[b], `${w.word}: ${a} vs ${b} explained but IPA identical`);
  }
});

test('known comparisons', () => {
  const ids = (w, a, b) => compareWord(w, a, b).diffs.map((d) => d.id);
  assert.deepEqual(ids('three', 'us', 'in').sort(), ['tap_r', 'th_start']);
  assert.ok(ids('water', 'us', 'uk').includes('rhotic') && ids('water', 'us', 'uk').includes('t_between'));
  assert.deepEqual(ids('ask', 'us', 'uk'), ['bath']);
  assert.deepEqual(ids('schedule', 'us', 'uk'), ['lex_schedule']);
  assert.deepEqual(ids('schedule', 'uk', 'au'), []);
  assert.deepEqual(ids('water', 'us', 'us'), []);
  assert.equal(compareWord('nonexistent', 'us', 'uk'), null);
  assert.equal(wordBy('WEDNESDAY').word, 'Wednesday');
});

test('overview lists differences most important first, with practice words', () => {
  const o = overview('in', 'us');
  assert.ok(o.length >= 5);
  assert.equal(FEATURES[o[0].id].rank, 1);
  for (let i = 1; i < o.length; i++) assert.ok(FEATURES[o[i - 1].id].rank <= FEATURES[o[i].id].rank);
  assert.ok(o.every((d) => d.words.length > 0));
  assert.deepEqual(overview('us', 'us'), []);
});

test('learner-language notes are complete', () => {
  for (const [id, n] of Object.entries(L1)) assert.ok(n.name && n.notes.length >= 3 && n.watch.length >= 3, id);
});

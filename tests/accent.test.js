import test from 'node:test';
import assert from 'node:assert/strict';
import { ACCENT_PROFILES, accentMatch, accentVariants, profileById } from '../src/engine/accent.js';
import { align } from '../src/speech.js';

const P = (id) => profileById(id);

test('Indian English: th→t/d and v/w are accepted, unrelated words are not', () => {
  assert.ok(accentMatch(P('en-IN'), 'think', 'tink'));
  assert.ok(accentMatch(P('en-IN'), 'this', 'dis'));
  assert.ok(accentMatch(P('en-IN'), 'very', 'wery'));
  assert.equal(accentMatch(P('en-IN'), 'think', 'sink'), null);
  assert.equal(accentMatch(P('en-IN'), 'think', 'think'), null);
});

test('South of England: th-fronting, h-dropping and -in', () => {
  assert.ok(accentMatch(P('en-GB-S'), 'think', 'fink'));
  assert.ok(accentMatch(P('en-GB-S'), 'house', 'ouse'));
  assert.ok(accentMatch(P('en-GB-S'), 'going', 'goin'));
});

test('Spanish speaker: b/v, s-clusters; German speaker: w→v and final devoicing', () => {
  assert.ok(accentMatch(P('es'), 'very', 'bery'));
  assert.ok(accentMatch(P('es'), 'school', 'eschool'));
  assert.ok(accentMatch(P('de'), 'water', 'vater'));
  assert.ok(accentMatch(P('de'), 'bad', 'bat'));
});

test('"Standard" and unknown ids allow nothing', () => {
  assert.equal(accentMatch(P('none'), 'think', 'tink'), null);
  assert.equal(profileById('nonsense').id, 'none');
  assert.equal(accentMatch(null, 'think', 'tink'), null);
});

test('variants stay small and never include the empty word', () => {
  for (const p of ACCENT_PROFILES) {
    for (const w of ['think', 'very', 'house', 'water', 'school', 'brother']) {
      const v = accentVariants(w, p.rules);
      assert.ok(v.size <= 120);
      assert.ok(!v.has(''));
    }
  }
});

test('align accepts accent variants only when an accent is given', () => {
  const target = ['i', 'think', 'it', 'is', 'very', 'good'], heard = ['i', 'tink', 'it', 'is', 'wery', 'good'];
  assert.deepEqual(align(target, heard, false, false).st, ['ok', 'bad', 'ok', 'ok', 'bad', 'ok']);
  const a = align(target, heard, false, false, P('en-IN'));
  assert.deepEqual(a.st, ['ok', 'ok', 'ok', 'ok', 'ok', 'ok']);
  assert.equal(a.hd[1], 'tink');
});

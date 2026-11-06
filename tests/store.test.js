import test from 'node:test';
import assert from 'node:assert/strict';
import { iso, sanitize } from '../src/store.js';

test('dates use the local calendar day, not UTC', () => {
  assert.equal(iso(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  assert.equal(iso(new Date(2026, 0, 5, 0, 1)), '2026-01-05');
  assert.equal(iso(new Date(2026, 11, 31, 12)), '2026-12-31');
});

test('sanitize repairs damaged or imported data instead of crashing', () => {
  const bad = sanitize({ xp: 'lots', streak: null, mistakes: 'no', words: [], done: null, daily: 5, voice: 'x', ui: 7 });
  assert.equal(bad.xp, 0); assert.equal(bad.streak, 0);
  assert.deepEqual(bad.mistakes, []); assert.deepEqual(bad.words, {}); assert.deepEqual(bad.done, {});
  assert.deepEqual(bad.daily, { d: null, xp: 0 });
  assert.equal(typeof bad.voice.accent, 'string'); assert.equal(bad.ui, 'en');
  assert.equal(sanitize(null).xp, 0);
  assert.equal(sanitize({ xp: 250, streak: 4, ui: 'hi', known: 'hi' }).xp, 250);
});

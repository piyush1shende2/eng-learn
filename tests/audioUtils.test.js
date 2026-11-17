import test from 'node:test';
import assert from 'node:assert/strict';
import { concatChunks, resampleTo16k, rms, isSilent, whisperLang, cleanText } from '../src/engine/audioUtils.js';

test('concatChunks joins pieces into a new array', () => {
  const a = new Float32Array([1, 2]), out = concatChunks([a, new Float32Array([3])]);
  assert.deepEqual(Array.from(out), [1, 2, 3]);
  assert.notEqual(out, a);
  assert.notEqual(concatChunks([a]).buffer, a.buffer);
});

test('resampleTo16k gives the right length and keeps a constant signal', () => {
  const src = new Float32Array(48000).fill(0.5), out = resampleTo16k(src, 48000);
  assert.equal(out.length, 16000);
  assert.ok(out.every((x) => Math.abs(x - 0.5) < 1e-6));
  assert.equal(resampleTo16k(src, 16000), src);
  assert.equal(resampleTo16k(new Float32Array(44100), 44100).length, 16000);
});

test('rms and isSilent', () => {
  assert.equal(rms(new Float32Array(0)), 0);
  assert.ok(isSilent(new Float32Array(1000).fill(0.001)));
  assert.ok(!isSilent(new Float32Array(1000).fill(0.2)));
});

test('whisperLang maps accents to a language and leaves unknown languages to auto-detect', () => {
  assert.equal(whisperLang('en-GB'), 'en');
  assert.equal(whisperLang('hi-IN'), 'hi');
  assert.equal(whisperLang('ota'), undefined);
  assert.equal(whisperLang(), 'en');
});

test('cleanText removes tags and silence hallucinations only when the audio was quiet', () => {
  assert.equal(cleanText(' Hello   [BLANK_AUDIO] there ', false), 'Hello there');
  assert.equal(cleanText('Thank you.', true), '');
  assert.equal(cleanText('Thank you.', false), 'Thank you.');
  assert.equal(cleanText('(music)', false), '');
});

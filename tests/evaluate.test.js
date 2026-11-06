import test from 'node:test';
import assert from 'node:assert/strict';
import { fixText } from '../src/evaluate.js';

const fixed = (t, spoken = false) => fixText(t, spoken).fixed;

test('leaves correct questions and phrases alone', () => {
  for (const t of ['Does he like tea?', 'Did she go home?', 'Can he play cricket?', 'Where does she live?', 'Let it go.', 'It is good in theory.', 'I need an MBA.', 'A user can log in.']) {
    assert.equal(fixed(t), t, t);
  }
});

test('still corrects real mistakes', () => {
  assert.equal(fixed('She go to school.'), 'She goes to school.');
  assert.equal(fixed('He like tea'), 'He likes tea.');
  assert.equal(fixed('I am good in maths'), 'I am good at maths.');
  assert.equal(fixed('I am agree with you.'), 'I agree with you.');
  assert.equal(fixed('I goed there yesterday.'), 'I went there yesterday.');
});

test('reports what was changed', () => {
  const r = fixText('She go to school.', false);
  assert.ok(r.errors.length >= 1);
  assert.ok(r.toks.some((t) => t.bad));
});

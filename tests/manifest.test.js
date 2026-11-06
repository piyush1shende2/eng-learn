import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pub = path.resolve(import.meta.dirname, '..', 'public');
const read = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);

test('voice library files all exist', () => {
  const m = read(path.join(pub, 'voices', 'manifest.json'));
  assert.ok(m && Array.isArray(m.libraries));
  for (const lib of m.libraries) for (const c of lib.clips) {
    for (const f of new Set([c.file, ...Object.values(c.emotions || {})])) assert.ok(fs.existsSync(path.join(pub, 'voices', f)), `${lib.id}: missing ${f}`);
  }
});

test('accent manifest (when built) is well formed and every clip exists', () => {
  const m = read(path.join(pub, 'accents', 'manifest.json'));
  if (!m) return; // data not built yet: the app falls back to computer voices
  assert.ok(Array.isArray(m.groups) && m.groups.length);
  const ids = new Set();
  for (const g of m.groups) {
    assert.ok(!ids.has(g.id), 'duplicate group ' + g.id); ids.add(g.id);
    assert.ok(g.label && g.speakers.length);
    for (const s of g.speakers) for (const c of s.clips) assert.ok(fs.existsSync(path.join(pub, 'accents', c.file)), `missing ${c.file}`);
  }
  assert.ok(Array.isArray(m.sources) && m.sources.every((x) => x.license && x.credit));
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPath } from '../public/js/lib/format.js';

const ROOT = fileURLToPath(new URL('../public/', import.meta.url));
const strings = JSON.parse(readFileSync(join(ROOT, 'i18n/en.json'), 'utf8'));

function jsFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? jsFiles(full) : full.endsWith('.js') ? [full] : [];
  });
}

test('every static text key used in the code exists in en.json', () => {
  const keyPattern = /\bt(?:Data)?\(\s*['`]([a-zA-Z0-9_.-]+)['`]/g;
  const missing = jsFiles(join(ROOT, 'js')).flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(keyPattern)]
      .map((m) => m[1])
      .filter((key) => getPath(strings, key) === undefined)
      .map((key) => `${file}: ${key}`),
  );
  assert.deepEqual(missing, []);
});

test('every data file used by a route parses as JSON', () => {
  readdirSync(join(ROOT, 'data')).forEach((name) => {
    assert.doesNotThrow(() => JSON.parse(readFileSync(join(ROOT, 'data', name), 'utf8')), name);
  });
});

test('stories: 6–8 stories and at least half are women', () => {
  const stories = JSON.parse(readFileSync(join(ROOT, 'data/stories.json'), 'utf8'));
  assert.ok(stories.length >= 6 && stories.length <= 8);
  assert.ok(stories.filter((s) => s.gender === 'female').length >= stories.length / 2);
});

test('opportunities: 10–15 items; every route has 5 modules with a valid test answer', () => {
  const opps = JSON.parse(readFileSync(join(ROOT, 'data/opportunities.json'), 'utf8'));
  assert.ok(opps.length >= 10 && opps.length <= 15);
  const tracks = JSON.parse(readFileSync(join(ROOT, 'data/tracks.json'), 'utf8'));
  assert.equal(tracks.length, 4);
  tracks.forEach((track) => {
    assert.equal(track.modules.length, 5, track.id);
    track.modules.forEach((m) => assert.ok(m.test.options[m.test.answer], `${track.id}/${m.id}`));
  });
  const quiz = JSON.parse(readFileSync(join(ROOT, 'data/quiz.json'), 'utf8'));
  assert.equal(quiz.length, 8);
});

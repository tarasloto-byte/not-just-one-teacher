import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esc } from '../public/js/lib/escape.js';
import {
  getPath, interpolate, normalize, todayIso, daysBetween, dateParts, initials,
} from '../public/js/lib/format.js';
import { parseHash, matchRoute, buildHash } from '../public/js/lib/router.js';

test('esc escapes HTML special characters and handles null', () => {
  assert.equal(esc('<b a="1">\'&</b>'), '&lt;b a=&quot;1&quot;&gt;&#39;&amp;&lt;/b&gt;');
  assert.equal(esc(null), '');
  assert.equal(esc(42), '42');
});

test('getPath reads nested values and returns undefined for missing paths', () => {
  assert.equal(getPath({ a: { b: 'x' } }, 'a.b'), 'x');
  assert.equal(getPath({ a: {} }, 'a.b.c'), undefined);
});

test('interpolate replaces known placeholders and keeps unknown ones', () => {
  assert.equal(interpolate('{n} more steps, {name}', { n: 4 }), '4 more steps, {name}');
});

test('normalize strips Polish diacritics including ł', () => {
  assert.equal(normalize('  Biłgoraj '), 'bilgoraj');
  assert.equal(normalize('Ełk'), 'elk');
  assert.equal(normalize('Świętokrzyskie'), 'swietokrzyskie');
});

test('todayIso pads month and day', () => {
  assert.equal(todayIso(new Date(2026, 0, 5)), '2026-01-05');
});

test('daysBetween counts whole days, negative in the past', () => {
  assert.equal(daysBetween('2026-11-24', '2026-12-01'), 7);
  assert.equal(daysBetween('2026-12-01', '2026-11-24'), -7);
});

test('dateParts returns day and month labels', () => {
  const parts = dateParts('2027-02-10');
  assert.equal(parts.day, '10');
  assert.equal(parts.month, 'Feb');
});

test('initials uses up to two words', () => {
  assert.equal(initials('Ola Wójcik'), 'OW');
  assert.equal(initials('Kasia M.'), 'KM');
  assert.equal(initials(''), '');
});

test('parseHash splits path and query; ignores in-page anchors', () => {
  assert.deepEqual(parseHash('#/stories/ola?field=data'), {
    segments: ['stories', 'ola'],
    query: { field: 'data' },
  });
  assert.deepEqual(parseHash(''), { segments: [], query: {} });
  assert.equal(parseHash('#main'), null);
  assert.deepEqual(parseHash('#/x/%E0%A4%A').segments, ['x', '%E0%A4%A']);
});

test('matchRoute matches static and parameter segments', () => {
  const routes = [{ pattern: '' }, { pattern: 'stories' }, { pattern: 'stories/:id' }];
  assert.equal(matchRoute(routes, []).route, routes[0]);
  const match = matchRoute(routes, ['stories', 'kuba']);
  assert.equal(match.route, routes[2]);
  assert.deepEqual(match.params, { id: 'kuba' });
  assert.equal(matchRoute(routes, ['nope']), null);
});

test('buildHash drops empty values', () => {
  assert.equal(buildHash('/opportunities', { field: 'ai', region: '', tags: null }), '#/opportunities?field=ai');
  assert.equal(buildHash('/stories'), '#/stories');
});

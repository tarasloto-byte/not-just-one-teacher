import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  filterStories, resolveRegion, filterOpportunities, hasTag, nextWorkshop,
} from '../public/js/lib/filters.js';
import { scoreQuiz, withAnswer, isComplete } from '../public/js/lib/quiz.js';
import { computeSteps, completeModule, EMPTY_PROGRESS } from '../public/js/lib/progress.js';
import { rankCities } from '../public/js/lib/leaderboard.js';
import { validateJoin } from '../public/js/lib/validate.js';

const stories = [
  { id: 'a', region: 'lubelskie', field: 'data', gender: 'female' },
  { id: 'b', region: 'podlaskie', field: 'ai', gender: 'male' },
  { id: 'c', region: 'lubelskie', field: 'ai', gender: 'female' },
];
const regions = [{ id: 'lubelskie', name: 'Lubelskie' }, { id: 'pomorskie', name: 'Pomorskie' }];
const towns = [{ name: 'Biłgoraj', region: 'lubelskie' }, { name: 'Bytów', region: 'pomorskie' }];
const opps = [
  { id: 'online', title: 'Python', format: 'online', region: 'all', city: '', fields: ['programming'], forGirls: false, free: true, deadline: '2027-03-01' },
  { id: 'lublin', title: 'Hack Lublin', format: 'offline', region: 'lubelskie', city: 'Lublin', fields: ['data'], forGirls: false, free: true, deadline: '2027-02-01' },
  { id: 'gdansk', title: 'Camp', format: 'offline', region: 'pomorskie', city: 'Gdańsk', fields: ['all'], forGirls: true, free: false, deadline: '2027-01-01' },
];

test('filterStories combines region, field and gender', () => {
  assert.deepEqual(filterStories(stories, { region: 'lubelskie', field: 'ai' }).map((s) => s.id), ['c']);
  assert.equal(filterStories(stories, { gender: 'female' }).length, 2);
  assert.equal(filterStories(stories).length, 3);
});

test('resolveRegion understands towns, partial towns and region names', () => {
  assert.equal(resolveRegion('bilgoraj', towns, regions), 'lubelskie');
  assert.equal(resolveRegion('Byt', towns, regions), 'pomorskie');
  assert.equal(resolveRegion('Pomorskie', towns, regions), 'pomorskie');
  assert.equal(resolveRegion('B', towns, regions), '');
  assert.equal(resolveRegion('Xyz', towns, regions), '');
});

test('filterOpportunities keeps online items for any region and sorts by deadline', () => {
  assert.deepEqual(filterOpportunities(opps, { region: 'lubelskie' }).map((o) => o.id), ['lublin', 'online']);
  assert.deepEqual(filterOpportunities(opps).map((o) => o.id), ['gdansk', 'lublin', 'online']);
});

test('filterOpportunities applies free text, field and tags', () => {
  assert.deepEqual(filterOpportunities(opps, { text: 'gdansk' }).map((o) => o.id), ['gdansk', 'online']);
  assert.deepEqual(filterOpportunities(opps, { field: 'data' }).map((o) => o.id), ['gdansk', 'lublin']);
  assert.deepEqual(filterOpportunities(opps, { tags: ['forGirls'] }).map((o) => o.id), ['gdansk']);
  assert.deepEqual(filterOpportunities(opps, { tags: ['online', 'free'] }).map((o) => o.id), ['online']);
});

test('hasTag returns false for unknown tags', () => {
  assert.equal(hasTag(opps[0], 'unknown'), false);
});

test('nextWorkshop picks the soonest upcoming workshop in the region', () => {
  const workshops = [
    { region: 'lubelskie', date: '2026-10-01' },
    { region: 'lubelskie', date: '2027-01-14' },
    { region: 'lubelskie', date: '2026-12-03' },
    { region: 'pomorskie', date: '2026-11-30' },
  ];
  assert.equal(nextWorkshop(workshops, 'lubelskie', '2026-11-24').date, '2026-12-03');
  assert.equal(nextWorkshop(workshops, 'slaskie', '2026-11-24'), null);
});

test('scoreQuiz counts answers per track and breaks ties by track order', () => {
  const q = (tracks) => ({ options: tracks.map((track) => ({ track })) });
  const questions = [q(['programming', 'design', 'data', 'ai']), q(['programming', 'design', 'data', 'ai']), q(['programming', 'design', 'data', 'ai'])];
  assert.equal(scoreQuiz(questions, [3, 3, 0]).winner, 'ai');
  assert.equal(scoreQuiz(questions, [1, 2, 9]).winner, 'design');
  assert.equal(scoreQuiz(questions, []).winner, 'programming');
});

test('withAnswer does not mutate and isComplete checks every answer', () => {
  const answers = [0];
  const next = withAnswer(answers, 1, 2);
  assert.deepEqual(answers, [0]);
  assert.deepEqual(next, [0, 2]);
  assert.equal(isComplete([{}, {}], next), true);
  assert.equal(isComplete([{}, {}], answers), false);
});

test('computeSteps: fresh profile has the workshop done and 4 steps left', () => {
  const result = computeSteps(EMPTY_PROGRESS);
  assert.equal(result.completed, 1);
  assert.equal(result.remaining, 4);
  assert.equal(result.percent, 20);
});

test('computeSteps: full route and live session completes everything', () => {
  let progress = { ...EMPTY_PROGRESS, quizTrack: 'data', sessionBooked: true };
  ['m1', 'm2', 'm3', 'm4', 'm5'].forEach((id) => { progress = completeModule(progress, 'data', id); });
  const result = computeSteps(progress);
  assert.equal(result.remaining, 0);
  assert.equal(result.percent, 100);
});

test('completeModule is immutable and idempotent', () => {
  const start = { ...EMPTY_PROGRESS, quizTrack: 'ai' };
  const once = completeModule(start, 'ai', 'm1');
  assert.deepEqual(start.modulesDone, {});
  assert.deepEqual(once.modulesDone.ai, ['m1']);
  assert.equal(completeModule(once, 'ai', 'm1'), once);
});

test('rankCities ranks by points per student, not totals', () => {
  const ranked = rankCities([
    { town: 'Big', students: 100, modules: 100, tasks: 100, sessions: 10 },
    { town: 'Small', students: 10, modules: 20, tasks: 20, sessions: 5 },
    { town: 'Empty', students: 0, modules: 0, tasks: 0, sessions: 0 },
  ]);
  assert.deepEqual(ranked.map((c) => c.town), ['Small', 'Big', 'Empty']);
  assert.equal(ranked[0].rank, 1);
  assert.equal(ranked[0].perStudent, 37.5);
  assert.equal(ranked[2].perStudent, 0);
});

test('validateJoin accepts a complete form and cleans whitespace', () => {
  const result = validateJoin({ name: '  Ola ', city: 'Biłgoraj', school: 'LO  1', age: '17', gender: 'female', consent: true });
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { name: 'Ola', city: 'Biłgoraj', school: 'LO 1', age: '17', gender: 'female' });
});

test('validateJoin reports every invalid field', () => {
  const result = validateJoin({ name: 'O', city: '', school: 'x'.repeat(81), age: '30', gender: 'x', consent: false });
  assert.equal(result.ok, false);
  assert.equal(result.value, null);
  assert.deepEqual(Object.keys(result.errors).sort(), ['age', 'city', 'consent', 'gender', 'name', 'school']);
});

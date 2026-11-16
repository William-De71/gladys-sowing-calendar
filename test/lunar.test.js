// The lunar option: the days of the almanac against a published calendar
// (icalendrier.fr, 2026), the favourable days of a window, their words.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { favourableRuns, runsText, suits } from '../src/lunar.js';
import { lunarOf } from './helpers.js';

const published = JSON.parse(
  readFileSync(new URL('./fixtures/icalendrier-2026.json', import.meta.url), 'utf8'),
);

test('the lunar days match the published calendar (autumn 2026)', () => {
  const days = lunarOf('2026-09-01', '2026-12-31');
  let checked = 0;
  for (const [day, expected] of Object.entries(published)) {
    if (day < '2026-09-01') continue;
    const lunar = days.get(day);
    assert.ok(expected.types.includes(lunar.type), `${day}: ${lunar.type}`);
    assert.equal(lunar.trajectory, expected.trajectory, day);
    assert.equal(lunar.avoid, expected.avoid, day);
    checked += 1;
  }
  assert.equal(checked, 122);
});

test('a day suits a crop of its type, never a day to avoid', () => {
  assert.equal(suits({ type: 'root', avoid: false }, 'root'), true);
  assert.equal(suits({ type: 'root', avoid: true }, 'root'), false);
  assert.equal(suits({ type: 'leaf', avoid: false }, 'root'), false);
  assert.equal(suits(undefined, 'root'), false);
});

test('favourable days of a window, as runs, from today on', () => {
  const days = new Map([
    ['2027-04-01', { type: 'root', avoid: false }],
    ['2027-04-02', { type: 'root', avoid: false }],
    ['2027-04-03', { type: 'root', avoid: true }],
    ['2027-04-04', { type: 'root', avoid: false }],
    ['2027-04-05', { type: 'leaf', avoid: false }],
  ]);
  const window = { start: '2027-04-01', end: '2027-04-05' };
  assert.deepEqual(favourableRuns(days, window, 'root'), [
    { from: '2027-04-01', to: '2027-04-02' },
    { from: '2027-04-04', to: '2027-04-04' },
  ]);
  assert.deepEqual(favourableRuns(days, window, 'root', '2027-04-02'), [
    { from: '2027-04-02', to: '2027-04-02' },
    { from: '2027-04-04', to: '2027-04-04' },
  ]);
  const runs = favourableRuns(days, window, 'root');
  assert.equal(runsText(runs, 'fr'), '1–2 avr., 4 avr.');
  // Intl writes an English range with thin spaces around the dash.
  const spaced = (text) => text.replace(/\u2009/g, ' ');
  assert.equal(spaced(runsText(runs, 'en')), 'Apr 1 – 2, Apr 4');
  assert.equal(spaced(runsText(runs, 'en', 1)), 'Apr 1 – 2, …');
  assert.equal(runsText([], 'en'), '');
});

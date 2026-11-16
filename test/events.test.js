// What the scenes get: the daily summary, a window that opens, a window in
// its last week, the scene action; flat payloads within the limits of Gladys.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CROPS } from '../src/crops.js';
import { TRIGGERS, eventsOfDay, gardenTasksOutputs } from '../src/events.js';
import { climateText, gardenOn } from '../src/garden.js';
import { climateOf, windowsBetween } from '../src/plan.js';
import { lunarOf } from './helpers.js';

const windows = windowsBetween(DEFAULT_CROPS, climateOf({}), '2027-03-25', '2027-07-01');
const lunar = lunarOf('2027-03-25', '2027-07-01');

/**
 * @description Check a scene payload against the limits of Gladys.
 * @param {object} data - The payload.
 */
function assertFlat(data) {
  const entries = Object.entries(data);
  assert.ok(entries.length <= 30, `${entries.length} keys`);
  for (const [key, value] of entries) {
    assert.ok(['string', 'number', 'boolean'].includes(typeof value) || value === null, key);
    if (typeof value === 'string') assert.ok(value.length <= 1000, key);
  }
}

test('the garden of a day: open windows by task, openings, last weeks, the moon', () => {
  const garden = gardenOn(windows, '2027-04-01', lunar);
  assert.deepEqual(
    garden.byTask.sow_indoors.map((window) => window.crop),
    ['tomato', 'basil', 'cucumber', 'zucchini'],
  );
  assert.deepEqual(
    garden.opening.map((window) => window.id),
    ['cucumber-sow_indoors-2027-0', 'zucchini-sow_indoors-2027-0', 'radish-harvest-2027-0'],
  );
  assert.equal(garden.lunar.type, 'root');
  assert.deepEqual(
    garden.favourable.map((window) => window.crop),
    ['onion', 'carrot', 'radish', 'onion', 'potato', 'radish'],
  );
  assert.deepEqual(gardenOn(windows, '2027-04-01').favourable, [], 'no moon without the option');
});

test('the scene events of a day: the summary, then each opening and last week', () => {
  const events = eventsOfDay(windows, '2027-04-09', lunar, 'fr');
  assert.deepEqual(
    events.map((event) => event.key),
    [
      'daily',
      'closing:tomato-sow_indoors-2027-0',
      'closing:onion-sow_outdoors-2027-0',
      'closing:strawberry-plant_out-2027-0',
    ],
  );
  assert.deepEqual(
    events.map((event) => event.trigger),
    [
      TRIGGERS.DAILY_SUMMARY,
      TRIGGERS.WINDOW_CLOSING,
      TRIGGERS.WINDOW_CLOSING,
      TRIGGERS.WINDOW_CLOSING,
    ],
  );
  events.forEach((event) => assertFlat(event.data));
  const tomato = events[1].data;
  assert.deepEqual(
    [tomato.crop, tomato.task, tomato.start, tomato.end, tomato.end_label],
    ['tomato', 'sow_indoors', '2027-02-16', '2027-04-15', '15 avr.'],
  );
  assert.equal(
    tomato.summary,
    `Semis sous abri, Tomate : dernière semaine, jusqu’au 15 avr. ${tomato.lunar_days}`,
  );
  assert.match(tomato.lunar_days, /^Jours fruits favorables : /);
});

test('the daily summary in words, with the lunar day', () => {
  const [daily] = eventsOfDay(windows, '2027-04-01', lunar, 'en');
  assert.equal(daily.data.task_count, 17);
  assert.equal(daily.data.has_opening, 'yes');
  assert.equal(daily.data.harvest, 'Radish');
  assert.equal(daily.data.day_type, 'root');
  assert.equal(daily.data.avoid, 'no');
  assert.equal(daily.data.favourable, 'Onion, Carrot, Radish, Potato');
  assert.match(daily.data.summary, /^Sow under cover: Tomato, Basil, Cucumber, Zucchini\. /);
  assert.match(daily.data.summary, /Starting today: Cucumber \(Sow under cover\), /);
  assert.match(daily.data.summary, /Root day: good for Onion, Carrot, Radish, Potato\.$/);
  const [plain] = eventsOfDay(windows, '2027-04-01', null, 'en');
  assert.deepEqual([plain.data.day_type, plain.data.avoid, plain.data.favourable], ['', '', '']);
  assert.doesNotMatch(plain.data.summary, /Root day/);
});

test('an empty day says so, and a day to avoid is told', () => {
  const none = eventsOfDay([], '2027-01-05', null, 'de');
  assert.equal(none[0].data.summary, 'Heute gibt es nichts zu säen, pflanzen oder ernten.');
  assert.equal(none[0].data.task_count, 0);
  const avoidDay = [...lunar.entries()].find(([, day]) => day.avoid)[0];
  const [daily] = eventsOfDay(windows, avoidDay, lunar, 'fr');
  assert.equal(daily.data.avoid, 'yes');
  assert.equal(daily.data.favourable, '');
  assert.match(daily.data.summary, /Jour à éviter selon la lune : ni semis ni plantation\.$/);
});

test('the scene action: today or tomorrow, the declared outputs only', () => {
  const today = gardenTasksOutputs(windows, '2027-03-31', {}, null, 'es');
  const tomorrow = gardenTasksOutputs(windows, '2027-03-31', { day: 'tomorrow' }, null, 'es');
  assert.equal(today.date, '2027-03-31');
  assert.equal(tomorrow.date, '2027-04-01');
  assert.match(tomorrow.summary, /A partir de mañana: Pepino \(Siembra en semillero\)/);
  assert.equal(
    gardenTasksOutputs(windows, '2027-03-31', { day: 'x' }, null, 'es').date,
    today.date,
  );
  assertFlat(today);
});

test('the climate in words', () => {
  assert.equal(climateText(climateOf({}), 'fr'), 'Zone tempérée');
  assert.equal(
    climateText(climateOf({ zone: 'mountain', offsetWeeks: -2, hemisphere: 'south' }), 'en'),
    'Mountain zone, −2 wk, southern hemisphere',
  );
});

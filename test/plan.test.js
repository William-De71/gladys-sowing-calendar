// The windows as real dates: reference climate, climate zones, fine
// adjustment, southern hemisphere, windows over the new year, stable ids.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CROPS } from '../src/crops.js';
import {
  ZONES,
  climateOf,
  daysLeft,
  halfDay,
  lastWeekOf,
  openOn,
  windowsBetween,
} from '../src/plan.js';

const year = (crops, climate = {}, tasks) =>
  windowsBetween(crops, climateOf(climate), '2027-01-01', '2027-12-31', tasks);
const find = (windows, id) => windows.find((window) => window.id === id);
const span = (window) => [window.start, window.end];

test('half-months run from the 1st or the 16th to the 15th or the end of the month', () => {
  assert.equal(halfDay(2027, 0, 'first'), '2027-01-01');
  assert.equal(halfDay(2027, 3, 'first'), '2027-02-16');
  assert.equal(halfDay(2027, 3, 'last'), '2027-02-28');
  assert.equal(halfDay(2028, 3, 'last'), '2028-02-29');
  assert.equal(halfDay(2027, 6, 'last'), '2027-04-15');
  assert.equal(halfDay(2027, 24 + 5, 'last'), '2028-03-31');
});

test('the reference climate gives the dates of the table', () => {
  const windows = year(['tomato']);
  assert.deepEqual(span(find(windows, 'tomato-sow_indoors-2027-0')), ['2027-02-16', '2027-04-15']);
  assert.deepEqual(span(find(windows, 'tomato-plant_out-2027-0')), ['2027-05-01', '2027-06-15']);
  assert.deepEqual(span(find(windows, 'tomato-harvest-2027-0')), ['2027-07-01', '2027-10-15']);
  assert.deepEqual(climateOf({}), { zone: 'temperate', hemisphere: 'north', offsetWeeks: 0 });
  assert.deepEqual(climateOf({ zone: 'moon', hemisphere: 'east', offsetWeeks: 1.5 }), {
    zone: 'temperate',
    hemisphere: 'north',
    offsetWeeks: 0,
  });
});

test('a warm zone stretches the season, a cold one shrinks it', () => {
  const med = year(['tomato', 'spinach'], { zone: 'mediterranean' });
  // Spring dates three weeks earlier, autumn dates three weeks later.
  assert.deepEqual(span(find(med, 'tomato-sow_indoors-2027-0')), ['2027-01-26', '2027-03-25']);
  assert.deepEqual(span(find(med, 'tomato-harvest-2027-0')), ['2027-06-10', '2027-11-05']);
  assert.deepEqual(span(find(med, 'spinach-sow_outdoors-2027-1')), ['2027-09-06', '2027-11-05']);
  const mountain = year(['tomato'], { zone: 'mountain' });
  assert.deepEqual(span(find(mountain, 'tomato-plant_out-2027-0')), ['2027-05-22', '2027-07-06']);
  assert.deepEqual(span(find(mountain, 'tomato-harvest-2027-0')), ['2027-07-22', '2027-09-24']);
  for (const zone of Object.values(ZONES)) {
    assert.ok(zone.spring === -zone.autumn || Math.sign(zone.spring) === -Math.sign(zone.autumn));
  }
});

test('the fine adjustment moves every date, the southern hemisphere six months', () => {
  const later = year(['tomato'], { offsetWeeks: 2 });
  assert.deepEqual(span(find(later, 'tomato-sow_indoors-2027-0')), ['2027-03-02', '2027-04-29']);
  const earlier = year(['tomato'], { offsetWeeks: -1 });
  assert.deepEqual(span(find(earlier, 'tomato-plant_out-2027-0')), ['2027-04-24', '2027-06-08']);
  const south = year(['tomato'], { hemisphere: 'south' });
  assert.deepEqual(span(find(south, 'tomato-sow_indoors-2027-0')), ['2027-08-16', '2027-10-15']);
  // The reference year of a southern window is the one of its northern start.
  assert.deepEqual(span(find(south, 'tomato-harvest-2026-0')), ['2027-01-01', '2027-04-15']);
});

test('a window can run over the new year, and keeps at least a week', () => {
  const windows = windowsBetween(['parsnip'], climateOf({}), '2026-11-15', '2027-03-31');
  assert.deepEqual(span(find(windows, 'parsnip-harvest-2026-0')), ['2026-10-01', '2027-03-15']);
  // Rhubarb plant-out of March 1-31, in the mountains: spring +3 weeks on both ends.
  const rhubarb = year(['rhubarb'], { zone: 'mountain' });
  assert.deepEqual(span(find(rhubarb, 'rhubarb-plant_out-2027-0')), ['2027-03-22', '2027-04-21']);
  for (const zone of Object.keys(ZONES)) {
    for (const offsetWeeks of [-4, 0, 4]) {
      for (const hemisphere of ['north', 'south']) {
        const all = windowsBetween(
          CROPS.map((crop) => crop.key),
          climateOf({ zone, offsetWeeks, hemisphere }),
          '2026-11-08',
          '2027-11-15',
        );
        assert.ok(all.length > 150 && all.length < 260, `${zone} ${offsetWeeks}: ${all.length}`);
        assert.equal(new Set(all.map((w) => w.id)).size, all.length, 'unique ids');
        for (const window of all) {
          assert.ok(daysLeft(window, window.start) >= 7, window.id);
        }
      }
    }
  }
});

test('ids never hold a date: a new climate moves the windows, same ids', () => {
  const ids = (climate) =>
    year(['tomato', 'garlic', 'leek'], climate)
      .map((window) => window.id)
      .sort();
  assert.deepEqual(ids({ zone: 'mountain' }), ids({ zone: 'temperate' }));
  assert.deepEqual(ids({ offsetWeeks: 1 }), ids({}));
});

test('the tasks asked only, sorted by start date', () => {
  const windows = year(['tomato', 'carrot'], {}, ['harvest']);
  assert.ok(windows.every((window) => window.task === 'harvest'));
  const starts = windows.map((window) => window.start);
  assert.deepEqual(starts, [...starts].sort());
  assert.deepEqual(year(['unknown']), []);
});

test('open windows, last week and days left', () => {
  const windows = year(['tomato']);
  assert.deepEqual(
    openOn(windows, '2027-05-10').map((window) => window.id),
    ['tomato-plant_out-2027-0'],
  );
  const plant = find(windows, 'tomato-plant_out-2027-0');
  assert.equal(lastWeekOf(plant), '2027-06-09');
  assert.equal(daysLeft(plant, '2027-06-09'), 7);
  assert.equal(daysLeft(plant, '2027-06-15'), 1);
  assert.equal(lastWeekOf({ start: '2027-03-01', end: '2027-03-10' }), null);
});

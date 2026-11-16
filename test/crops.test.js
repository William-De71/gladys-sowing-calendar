// The table of the crops: stable keys, valid ranges, names in four languages,
// a few dates checked against the usual gardening calendars.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CROPS,
  DAY_TYPES,
  DEFAULT_CROPS,
  GROUPS,
  TASKS,
  cropName,
  cropOf,
  parseHalf,
  parseRanges,
} from '../src/crops.js';
import { LANGUAGES } from '../src/i18n.js';

test('half-months and ranges are read as written', () => {
  assert.equal(parseHalf('01a'), 0);
  assert.equal(parseHalf('02b'), 3);
  assert.equal(parseHalf('12b'), 23);
  assert.deepEqual(parseRanges('02b-04a'), [{ from: 3, to: 6 }]);
  assert.deepEqual(parseRanges('03a-04b,07b-09a'), [
    { from: 4, to: 7 },
    { from: 13, to: 16 },
  ]);
  assert.throws(() => parseHalf('13a'));
  assert.throws(() => parseHalf('2a'));
});

test('55 crops with stable keys, a group, a lunar type and valid tasks', () => {
  assert.equal(CROPS.length, 55);
  assert.equal(CROPS.filter((crop) => crop.group === 'vegetable').length, 43);
  assert.equal(CROPS.filter((crop) => crop.group === 'herb').length, 12);
  const keys = CROPS.map((crop) => crop.key);
  assert.equal(new Set(keys).size, keys.length, 'unique keys');
  for (const crop of CROPS) {
    assert.match(crop.key, /^[a-z][a-z_]*$/, crop.key);
    assert.ok(GROUPS.includes(crop.group), crop.key);
    assert.ok(DAY_TYPES.includes(crop.type), crop.key);
    const tasks = Object.keys(crop.tasks);
    assert.ok(
      tasks.every((task) => TASKS.includes(task)),
      crop.key,
    );
    assert.ok(tasks.includes('harvest'), `${crop.key} is harvested`);
    assert.ok(
      tasks.some((task) => task !== 'harvest'),
      `${crop.key} is sown or planted`,
    );
    for (const [task, text] of Object.entries(crop.tasks)) {
      const ranges = parseRanges(text);
      assert.ok(ranges.length >= 1 && ranges.length <= 2, `${crop.key}.${task}`);
    }
  }
});

test('every name exists in the four languages, unique in each language', () => {
  for (const language of LANGUAGES) {
    const names = CROPS.map((crop) => crop.name[language]);
    assert.ok(
      names.every((name) => name && name.length <= 40),
      language,
    );
    assert.equal(new Set(names).size, names.length, `unique names in ${language}`);
  }
  assert.equal(cropName('carrot', 'de'), 'Möhre');
  assert.equal(cropName('carrot', 'xx'), 'Carrot');
  assert.equal(cropName('unknown', 'fr'), 'unknown');
  assert.equal(cropOf('unknown'), null);
});

test('the default crops exist, and the lunar types follow the part eaten', () => {
  assert.ok(DEFAULT_CROPS.every((key) => cropOf(key)));
  const type = (key) => cropOf(key).type;
  assert.deepEqual(
    ['tomato', 'carrot', 'lettuce', 'broccoli', 'basil', 'potato', 'bean'].map(type),
    ['fruit', 'root', 'leaf', 'flower', 'leaf', 'root', 'fruit'],
  );
});

test('a few dates of the reference climate, as in the usual calendars', () => {
  const tasks = (key) => cropOf(key).tasks;
  // Tomatoes: sown under cover from mid-February, planted out after the Ice Saints.
  assert.equal(tasks('tomato').sow_indoors, '02b-04a');
  assert.equal(tasks('tomato').plant_out, '05a-06a');
  // Garlic: planted in autumn and at the end of winter.
  assert.equal(tasks('garlic').plant_out, '10b-12a,02a-03a');
  // Lamb's lettuce: sown in summer, harvested over the winter.
  assert.equal(tasks('lambs_lettuce').harvest, '10a-03b');
});

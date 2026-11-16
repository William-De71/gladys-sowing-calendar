// The two widgets: their content in the four languages, accepted as is by
// Gladys (validateWidgetContent of the SDK), every day of a year.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateWidgetContent } from '@gladysassistant/integration-sdk';
import { CROPS, DEFAULT_CROPS } from '../src/crops.js';
import { addDays } from '../src/dates.js';
import { LANGUAGES } from '../src/i18n.js';
import { climateOf, windowsBetween } from '../src/plan.js';
import { SOON_DAYS, buildCropWidget, buildTasksWidget, ttlUntil } from '../src/widgets.js';
import { lunarOf } from './helpers.js';

const ALL = CROPS.map((crop) => crop.key);

/**
 * @description Check a content as Gladys would.
 * @param {object} content - The content.
 * @param {string} where - For the message.
 */
function assertAccepted(content, where) {
  assert.deepEqual(validateWidgetContent(content), [], where);
}

const tasksOn = (
  day,
  { crops = DEFAULT_CROPS, lunar = null, language = 'fr', climate = {} } = {},
) =>
  buildTasksWidget({
    windows: windowsBetween(crops, climateOf(climate), day, addDays(day, SOON_DAYS)),
    today: day,
    lunar,
    climate: climateOf(climate),
    language,
    ttl: 600,
  });

test('the tasks widget: one card per task, then what starts and what ends', () => {
  const content = tasksOn('2027-04-09');
  const [list, caption] = content.components;
  assert.equal(list.type, 'card-list');
  assert.deepEqual(
    list.items.map((item) => [item.title, item.badge.text]),
    [
      ['Semis sous abri', '4'],
      ['Semis en pleine terre', '8'],
      ['Plantation', '4'],
      ['Récolte', '1'],
      ['Commence cette semaine', '2'],
      ['Dernière semaine', '3'],
    ],
  );
  assert.equal(list.items[0].subtitle, 'Tomate, Basilic, Concombre, Courgette');
  assert.equal(
    list.items[1].subtitle,
    'Petit pois, Oignon, Carotte, Radis, Poireau, Épinard, Persi…',
  );
  assert.match(
    list.items[0].description,
    /^Tomate — jusqu’au 15 avr\.\nBasilic — jusqu’au 15 mai\n/,
  );
  assert.equal(
    list.items[4].description,
    'Laitue (Récolte) — dès le 16 avr.\nÉpinard (Récolte) — dès le 16 avr.',
  );
  assert.match(list.items[5].description, /^Tomate \(Semis sous abri\) — jusqu’au 15 avr\.\n/);
  assert.deepEqual(caption, { type: 'text', variant: 'caption', text: 'Zone tempérée' });
  assertAccepted(content, 'tasks');
});

test('the tasks widget with the moon: the day type and the crops it favours', () => {
  const lunar = lunarOf('2027-04-01', '2027-04-10');
  const [heading] = tasksOn('2027-04-01', { lunar }).components;
  assert.deepEqual(heading, {
    type: 'text',
    variant: 'heading',
    text: 'Jour racines · Oignon, Carotte, Radis, …',
  });
});

test('the tasks widget on an empty week says so', () => {
  const content = tasksOn('2027-01-05', { crops: ['tomato'] });
  assert.deepEqual(content.components[0], {
    type: 'text',
    variant: 'body',
    text: 'Rien à semer, planter ni récolter cette semaine pour les cultures de la configuration.',
  });
  assertAccepted(content, 'empty');
});

test('every day of a year, every crop, every language, with and without the moon', () => {
  const lunar = lunarOf('2027-01-01', '2028-01-10');
  for (let day = '2027-01-01'; day <= '2027-12-31'; day = addDays(day, 3)) {
    for (const language of LANGUAGES) {
      for (const moon of [null, lunar]) {
        assertAccepted(tasksOn(day, { crops: ALL, lunar: moon, language }), `${day} ${language}`);
      }
    }
  }
});

test('the crop widget: each task with its dates, in progress or next', () => {
  const day = '2027-04-01';
  const lunar = lunarOf(day, addDays(day, 120));
  const content = buildCropWidget({
    crop: 'carrot',
    windows: windowsBetween(['carrot'], climateOf({}), day, addDays(day, 366)),
    today: day,
    lunar,
    climate: climateOf({ zone: 'mountain', offsetWeeks: 1 }),
    language: 'de',
    ttl: 600,
  });
  const [heading, status, caption] = content.components;
  assert.equal(heading.text, 'Möhre');
  assert.deepEqual(
    status.items.map((item) => [
      item.icon,
      item.label,
      item.value.replace(/\u2009/g, ' '),
      item.color,
    ]),
    [
      ['sun', 'Aussaat ins Freiland', '1. März → 15. Juli', 'success'],
      ['shopping-bag', 'Ernte', '16. Juni → 30. Nov.', 'neutral'],
      ['moon', 'Wurzeltage', '1. Apr., 10.–11. Apr., …', 'neutral'],
    ],
  );
  assert.equal(caption.text, 'Bergklima, +1 Wo.');
  assertAccepted(content, 'crop');
});

test('the crop widget for every crop and language, and for an unknown crop', () => {
  for (const crop of ALL) {
    for (const language of LANGUAGES) {
      const content = buildCropWidget({
        crop,
        windows: windowsBetween([crop], climateOf({}), '2027-06-01', '2028-06-01'),
        today: '2027-06-01',
        lunar: null,
        climate: climateOf({}),
        language,
        ttl: 600,
      });
      assertAccepted(content, `${crop} ${language}`);
    }
  }
  const unknown = buildCropWidget({
    crop: 'unknown',
    windows: [],
    today: '2027-06-01',
    lunar: null,
    climate: climateOf({}),
    language: 'en',
    ttl: 600,
  });
  assert.equal(unknown.components[0].text, 'Choose a crop in the settings of the widget.');
});

test('the cache lasts until midnight, between 1 minute and 1 hour', () => {
  assert.equal(ttlUntil(10), 60);
  assert.equal(ttlUntil(1000), 1005);
  assert.equal(ttlUntil(20000), 3600);
});

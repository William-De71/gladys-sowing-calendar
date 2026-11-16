// The integration end to end, against the fake Gladys of the SDK: the
// calendar of the enabled users and what it shows, the scene events of the
// day (once, even after a restart), the widgets and the scene action.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createFakeGladys } from '@gladysassistant/integration-sdk/testing';
import { validateWidgetContent } from '@gladysassistant/integration-sdk';
import { createApp } from '../src/app.js';
import { TRIGGERS } from '../src/events.js';
import { silent } from './helpers.js';

const statePath = () => join(mkdtempSync(join(tmpdir(), 'sowing-')), 'state.json');
const john = { user: { selector: 'john', first_name: 'John', language: 'fr' }, config: {} };
const jane = { user: { selector: 'jane', first_name: 'Jane', language: 'en' }, config: {} };

/**
 * @description A started integration on a controllable clock.
 * @param {object} [options] - Options.
 * @returns {Promise<object>} `{ gladys, app, clock, path }`.
 */
async function start({
  at = '2027-04-01T03:00:00Z', // 05:00 in Paris
  config = {},
  accounts = [john],
  path = statePath(),
} = {}) {
  const clock = { now: new Date(at) };
  const gladys = createFakeGladys({
    config: { language: 'auto', ...config },
    calendarAccounts: accounts,
  });
  const app = createApp(gladys, {
    now: () => clock.now,
    timezone: 'Europe/Paris',
    statePath: path,
    sleep: async () => {},
    tickMs: 0,
    logger: silent,
  });
  await gladys.connect();
  await app.tick();
  return { gladys, app, clock, path };
}

const ok = (ack) => {
  assert.equal(ack.success, true, ack.error);
  return ack.data.content ?? ack.data.outputs ?? ack.data.message;
};
const eventsOf = (gladys, user) =>
  gladys.fake.calendarEvents.filter((e) => e.external_id.includes(`:${user}:`));

test('a calendar for each enabled user, in their language, a year ahead', async () => {
  const { gladys } = await start({ accounts: [john, jane] });
  assert.deepEqual(
    gladys.fake.calendars.map((c) => [c.user, c.name]),
    [
      ['john', 'Calendrier des semis'],
      ['jane', 'Sowing calendar'],
    ],
  );
  const events = eventsOf(gladys, 'john');
  assert.ok(events.length > 40 && events.length < 100, `${events.length} events`);
  assert.equal(new Set(events.map((e) => e.external_id)).size, events.length, 'unique ids');
  const tomato = events.find((e) => e.external_id.endsWith(':john:tomato-sow_indoors-2027-0'));
  assert.deepEqual(
    [tomato.name, tomato.start, tomato.end, tomato.full_day],
    ['Semis sous abri : Tomate', '2027-02-16', '2027-04-16', true],
  );
  assert.match(
    tomato.description,
    /^Tomate, semis sous abri : du 16 févr\. au 15 avr\. \(Zone tempérée\)\./,
  );
  assert.doesNotMatch(tomato.description, /favorables/, 'no moon by default');
  assert.ok(eventsOf(gladys, 'jane').some((e) => e.name === 'Sow under cover: Tomato'));
  assert.equal(
    gladys.fake.connectionStatus.message.fr,
    '16 cultures, zone tempérée. Aujourd’hui : 17 périodes en cours.',
  );
});

test('the configuration chooses the crops, the climate, the tasks and the moon', async () => {
  const { gladys } = await start({
    config: {
      crops: ['carrot', 'tomato'],
      zone: 'mountain',
      calendar_tasks: ['sow_outdoors', 'plant_out'],
      lunar: true,
    },
  });
  const events = eventsOf(gladys, 'john');
  assert.ok(events.every((e) => /:(carrot|tomato)-(sow_outdoors|plant_out)-/.test(e.external_id)));
  const tomato = events.find((e) => e.external_id.endsWith(':tomato-plant_out-2027-0'));
  assert.deepEqual([tomato.start, tomato.end], ['2027-05-22', '2027-07-07']);
  assert.match(tomato.description, /Zone de montagne/);
  assert.match(tomato.description, /Jours fruits favorables : /);
  // A new zone moves the same events, it never duplicates them.
  await gladys.fake.configUpdated({ ...gladys.fake.config, zone: 'temperate' });
  const moved = eventsOf(gladys, 'john').find((e) =>
    e.external_id.endsWith(':tomato-plant_out-2027-0'),
  );
  assert.deepEqual([moved.start, moved.end], ['2027-05-01', '2027-06-16']);
  assert.equal(eventsOf(gladys, 'john').length, events.length);
});

test('the scene events: at the event hour, once a day, even after a restart', async () => {
  const path = statePath();
  const first = await start({ path });
  assert.deepEqual(first.gladys.fake.sceneEvents, [], '05:00, before 07:00');
  first.clock.now = new Date('2027-04-01T05:00:05Z'); // 07:00:05 in Paris
  await first.app.tick();
  const events = first.gladys.fake.sceneEvents;
  assert.deepEqual(
    events.map((e) => e.key),
    [
      TRIGGERS.DAILY_SUMMARY,
      TRIGGERS.WINDOW_OPENED,
      TRIGGERS.WINDOW_OPENED,
      TRIGGERS.WINDOW_OPENED,
    ],
  );
  assert.equal(events[0].data.task_count, 17);
  assert.deepEqual(
    [events[1].data.crop, events[1].data.task, events[1].data.end],
    ['cucumber', 'sow_indoors', '2027-05-15'],
  );
  await first.app.tick();
  assert.equal(first.gladys.fake.sceneEvents.length, 4, 'never twice');
  const again = await start({ at: '2027-04-01T10:00:00Z', path });
  assert.deepEqual(again.gladys.fake.sceneEvents, []);
  const nextDay = await start({ at: '2027-04-02T10:00:00Z', path });
  assert.deepEqual(
    nextDay.gladys.fake.sceneEvents.map((e) => e.key),
    [TRIGGERS.DAILY_SUMMARY],
  );
});

test('a refused scene event is tried again, the others never twice', async () => {
  const { gladys, app, clock } = await start();
  const publish = gladys.publishSceneEvent.bind(gladys);
  let refuse = true;
  gladys.publishSceneEvent = async (key, data) => {
    if (refuse && key === TRIGGERS.WINDOW_OPENED && data.crop === 'zucchini') {
      throw new Error('quota');
    }
    return publish(key, data);
  };
  clock.now = new Date('2027-04-01T05:00:05Z');
  await app.tick();
  assert.equal(gladys.fake.sceneEvents.length, 3);
  refuse = false;
  await app.tick();
  assert.deepEqual(
    gladys.fake.sceneEvents.map((e) => e.data.crop ?? 'daily'),
    ['daily', 'cucumber', 'radish', 'zucchini'],
  );
});

test('the scene action and the language of the texts', async () => {
  const { gladys } = await start({ config: { lunar: true } });
  const tomorrow = ok(await gladys.fake.sceneAction('get_garden_tasks', { day: 'tomorrow' }));
  assert.equal(tomorrow.date, '2027-04-02');
  assert.match(tomorrow.summary, /^Semis sous abri : Tomate, Basilic, Concombre, Courgette\./);
  assert.equal(typeof tomorrow.task_count, 'number');
  // The dashboard is in German: the scene texts follow.
  await gladys.fake.widgetGet('tasks', { language: 'de' });
  const today = ok(await gladys.fake.sceneAction('get_garden_tasks', {}));
  assert.equal(today.day_type_label, 'Wurzeltag');
  assert.match(today.summary, /^Aussaat unter Glas: Tomate, Basilikum, Gurke, Zucchini\./);
});

test('the widgets, valid, cached until midnight', async () => {
  const { gladys } = await start();
  const tasks = ok(await gladys.fake.widgetGet('tasks', { language: 'fr' }));
  assert.deepEqual(validateWidgetContent(tasks), []);
  assert.equal(tasks.components[0].type, 'card-list');
  assert.ok(tasks.ttl_seconds >= 3600 - 1, '05:00: until midnight, at most an hour');
  const crop = ok(
    await gladys.fake.widgetGet('crop', { language: 'es', settings: { crop: 'leek' } }),
  );
  assert.deepEqual(validateWidgetContent(crop), []);
  assert.equal(crop.components[0].text, 'Puerro');
  const fallback = ok(await gladys.fake.widgetGet('crop', { language: 'en', settings: {} }));
  assert.equal(fallback.components[0].text, 'Tomato');
});

test('a user who enables the integration gets the calendar at once', async () => {
  const { gladys } = await start({ accounts: [] });
  assert.equal(gladys.fake.calendars.length, 0);
  gladys.fake.calendarAccounts.push(jane);
  await gladys.fake.calendarAccountUpdated('jane');
  assert.equal(gladys.fake.calendars.length, 1);
  assert.ok(gladys.fake.calendarEvents.length > 40);
});

test('every crop and every task stay within the limit of a request', async () => {
  const { gladys } = await start({
    config: { crops: JSON.stringify(['tomato']), lunar: true },
  });
  assert.ok(eventsOf(gladys, 'john').every((e) => e.external_id.includes(':tomato-')));
  const all = await start({
    config: {
      crops: [...new Set((await import('../src/crops.js')).CROPS.map((crop) => crop.key))],
      zone: 'mediterranean',
    },
  });
  const count = eventsOf(all.gladys, 'john').length;
  assert.ok(count > 150 && count <= 500, `${count} events`);
});

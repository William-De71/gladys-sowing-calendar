// The manifest, tied to the code: type, versions, store limits, the keys of
// the triggers, the action, the widgets and the configuration (keys are
// forever: this test lists them on purpose), and the crop lists in sync with
// src/crops.js (scripts/sync-crops.mjs).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { TRIGGERS, SCENE_ACTIONS, WHEN } from '../src/events.js';
import { WIDGETS } from '../src/widgets.js';
import { DEFAULT_WIDGET_CROP } from '../src/app.js';
import { EVENT_HOUR, AUTO_LANGUAGE } from '../src/config.js';
import { CROPS, DAY_TYPES, DEFAULT_CROPS, TASKS } from '../src/crops.js';
import { HEMISPHERES, OFFSET_WEEKS, ZONE_KEYS } from '../src/plan.js';
import { LANGUAGES, TEXTS } from '../src/i18n.js';

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const manifest = read('../gladys-assistant-integration.json');
const pkg = read('../package.json');
const byKey = (list) => new Map(list.map((entry) => [entry.key, entry]));
const values = (field) => field.options.map((option) => option.value);
const DAY_VALUES = [
  'date',
  'sow_indoors',
  'sow_outdoors',
  'plant_out',
  'harvest',
  'task_count',
  'opening',
  'has_opening',
  'closing',
  'day_type',
  'day_type_label',
  'avoid',
  'favourable',
  'summary',
];
const WINDOW_VALUES = [
  'crop',
  'crop_label',
  'task',
  'task_label',
  'start',
  'end',
  'end_label',
  'lunar_days',
  'summary',
];

test('a calendar integration, in lockstep with package.json, at 0.x until 1.0.0 is decided', () => {
  assert.equal(manifest.type, 'calendar');
  assert.equal(manifest.name, 'Sowing calendar');
  assert.equal(manifest.version, pkg.version);
  assert.equal(manifest.docker_image, `ghcr.io/william-de71/gladys-sowing-calendar:${pkg.version}`);
  assert.equal(manifest.gladys_version, '>=5.3.0');
  assert.deepEqual(manifest.transports, ['local']);
  assert.equal(pkg.license, 'Apache-2.0');
  for (const key of ['location', 'network_wake', 'containers', 'network_discovery', 'webhooks']) {
    assert.equal(manifest[key], undefined, key);
  }
  assert.equal(manifest.account_schema, undefined, 'nothing to type per user');
  assert.equal(manifest.countries, undefined, 'climate zones and hemispheres: worldwide');
});

test('local only: no network call in the code', () => {
  for (const file of [
    'app',
    'almanac',
    'calendar',
    'crops',
    'events',
    'garden',
    'lunar',
    'plan',
    'widgets',
    'store',
    'config',
  ]) {
    assert.doesNotMatch(
      source(`../src/${file}.js`),
      /fetch\(|node:https?|node:net|node:dgram/,
      file,
    );
  }
});

test('declares exactly the triggers, the action and the widgets the code handles', () => {
  const app = source('../src/app.js');
  assert.deepEqual(
    manifest.scene_triggers.map((t) => t.key),
    ['daily_summary', 'window_opened', 'window_closing'],
  );
  assert.deepEqual(
    Object.values(TRIGGERS),
    manifest.scene_triggers.map((t) => t.key),
  );
  assert.deepEqual(
    manifest.scene_actions.map((a) => a.key),
    Object.values(SCENE_ACTIONS),
  );
  assert.deepEqual(
    manifest.widgets.map((w) => w.key),
    Object.values(WIDGETS),
  );
  assert.match(app, /onWidgetGet\(WIDGETS\.TASKS/);
  assert.match(app, /onWidgetGet\(WIDGETS\.CROP/);
  assert.match(app, /onSceneAction\(SCENE_ACTIONS\.GET_GARDEN_TASKS/);

  const triggers = byKey(manifest.scene_triggers);
  const fields = (key) => byKey(triggers.get(key).fields);
  const variables = (key) => triggers.get(key).variables.map((v) => v.key);
  const daily = fields('daily_summary');
  assert.deepEqual([...daily.keys()], ['has_opening', 'day_type']);
  assert.deepEqual(values(daily.get('has_opening')), ['yes', 'no']);
  assert.deepEqual(values(daily.get('day_type')), DAY_TYPES);
  assert.deepEqual(
    variables('daily_summary'),
    DAY_VALUES.filter((key) => key !== 'has_opening'),
  );
  for (const key of ['window_opened', 'window_closing']) {
    assert.deepEqual([...fields(key).keys()], ['task', 'crop'], key);
    assert.deepEqual(values(fields(key).get('task')), TASKS, key);
    assert.deepEqual(variables(key), WINDOW_VALUES, key);
  }

  const action = manifest.scene_actions[0];
  assert.deepEqual(values(byKey(action.fields).get('day')), WHEN);
  assert.deepEqual(
    action.outputs.map((o) => o.key),
    DAY_VALUES,
  );
  assert.ok(action.timeout_seconds >= 5 && action.timeout_seconds <= 120);
});

test('mirrors the bounds and the values of the code', () => {
  const config = byKey(manifest.config_schema);
  assert.deepEqual(
    [...config.keys()],
    [
      'intro',
      'crops',
      'zone',
      'offset_weeks',
      'hemisphere',
      'calendar_tasks',
      'lunar',
      'event_hour',
      'language',
    ],
  );
  for (const bound of ['min', 'max', 'default']) {
    assert.equal(config.get('event_hour')[bound], EVENT_HOUR[bound]);
    assert.equal(config.get('offset_weeks')[bound], OFFSET_WEEKS[bound]);
  }
  assert.deepEqual(values(config.get('zone')), ZONE_KEYS);
  assert.equal(config.get('zone').default, 'temperate');
  assert.deepEqual(values(config.get('hemisphere')), HEMISPHERES);
  assert.deepEqual(values(config.get('calendar_tasks')), TASKS);
  assert.deepEqual(config.get('calendar_tasks').default, TASKS);
  assert.equal(config.get('lunar').default, false);
  assert.deepEqual(values(config.get('language')), [AUTO_LANGUAGE, ...LANGUAGES]);
  for (const task of TASKS) {
    assert.deepEqual(
      config.get('calendar_tasks').options.find((o) => o.value === task).label,
      TEXTS[`task_${task}`],
    );
  }
});

test('the four crop lists are those of src/crops.js (node scripts/sync-crops.mjs)', () => {
  const options = CROPS.map((crop) => ({ value: crop.key, label: crop.name }));
  const config = byKey(manifest.config_schema);
  assert.deepEqual(config.get('crops').options, options);
  assert.deepEqual(config.get('crops').default, DEFAULT_CROPS);
  const setting = byKey(byKey(manifest.widgets).get('crop').settings).get('crop');
  assert.deepEqual(setting.options, options);
  assert.equal(setting.default, DEFAULT_WIDGET_CROP);
  for (const trigger of ['window_opened', 'window_closing']) {
    const field = byKey(byKey(manifest.scene_triggers).get(trigger).fields).get('crop');
    assert.deepEqual(field.options, options, trigger);
  }
});

test('limits of the store: sizes, catalog description, links over https', () => {
  const size = statSync(new URL('../gladys-assistant-integration.json', import.meta.url)).size;
  // The indexer refuses a manifest over 100 KB, silently.
  assert.ok(size < 90 * 1024, `${size} bytes, keep a margin under 100 KB`);
  for (const language of LANGUAGES) {
    const { length } = manifest.description[language];
    assert.ok(length >= 10 && length <= 100, `description.${language}: ${length}`);
    for (const widget of manifest.widgets) {
      const label = widget.label[language].length;
      assert.ok(label >= 3 && label <= 30, widget.key);
      assert.ok(widget.description[language].length <= 100, widget.key);
    }
  }
  for (const field of manifest.config_schema) {
    for (const link of field.links ?? []) {
      assert.match(link.url, /^https:\/\//);
    }
  }
  const cover = readFileSync(new URL('../cover.jpg', import.meta.url));
  assert.ok(cover.length < 150 * 1024, `cover.jpg: ${cover.length} bytes`);
  assert.equal(cover.readUInt16BE(0), 0xffd8, 'cover.jpg is a JPEG');
});

test('catalog fields of Gladys 5.3: search keywords, worldwide', () => {
  assert.ok(manifest.keywords.length >= 1 && manifest.keywords.length <= 10, '1 to 10 keywords');
  for (const keyword of manifest.keywords) {
    assert.ok(keyword.trim().length >= 2 && keyword.trim().length <= 30, `"${keyword}"`);
  }
  const normalized = manifest.keywords.map((keyword) => keyword.trim().toLowerCase());
  assert.equal(new Set(normalized).size, normalized.length, 'keywords are unique');
  assert.ok(!normalized.includes(manifest.name.toLowerCase()), 'the name is already searched');
  assert.ok(manifest.categories.length >= 1 && manifest.categories.length <= 3);
});

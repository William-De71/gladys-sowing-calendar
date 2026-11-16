// -----------------------------------------------------------------------------
// Dashboard widgets of the sowing calendar (pure functions, reused by
// docs/illustrations/gen.mjs).
//
//   - `tasks`  what to do in the garden: one card per task open today (the
//              crops, until when), the windows starting within a week, the
//              windows in their last week; with the lunar option, the day type
//              of today and the crops it favours;
//   - `crop`   one crop (setting `crop`): each task with its dates (in
//              progress or next), and with the lunar option its next
//              favourable days.
//
// Semantic colors only. Content budget of a card: 2 texts (1 body), 1 focal
// component (the card list), 1 status list.
// -----------------------------------------------------------------------------

import { TASKS, cropName, cropOf } from './crops.js';
import { addDays } from './dates.js';
import { cropList, climateText, gardenOn, taskCropList } from './garden.js';
import { favourableRuns, runsText } from './lunar.js';
import { clip, formatDate, t } from './i18n.js';

const WIDGETS = { TASKS: 'tasks', CROP: 'crop' };
const TTL = { min: 60, max: 3600 };
const SOON_DAYS = 7;
const TASK_COLORS = {
  sow_indoors: 'info',
  sow_outdoors: 'success',
  plant_out: 'primary',
  harvest: 'warning',
};
const TASK_ICONS = {
  sow_indoors: 'home',
  sow_outdoors: 'sun',
  plant_out: 'arrow-down-circle',
  harvest: 'shopping-bag',
};

/**
 * @description The cache duration of a content: until the next change
 * (midnight, a few seconds after), between 1 minute and 1 hour.
 * @param {number} secondsToChange - Seconds until the content changes.
 * @returns {number} The ttl in seconds.
 */
const ttlUntil = (secondsToChange) =>
  Math.min(TTL.max, Math.max(TTL.min, Math.round(secondsToChange) + 5));

/**
 * @description One line per window: "Tomato — until Apr 15".
 * @param {object[]} windows - Windows.
 * @param {string} language - The language.
 * @param {Function} what - `(window) => text` after the dash.
 * @param {boolean} [withTask] - Name the task after the crop.
 * @returns {string} The lines.
 */
const lines = (windows, language, what, withTask = false) =>
  windows
    .map((window) => {
      const name = withTask
        ? t('taskCrop', language, {
            crop: cropName(window.crop, language),
            task: t(`task_${window.task}`, language),
          })
        : cropName(window.crop, language);
      return `${name} — ${what(window)}`;
    })
    .join('\n');

/**
 * @description The "tasks" widget.
 * @param {object} options - Options.
 * @param {object[]} options.windows - Windows covering today and the next week.
 * @param {string} options.today - YYYY-MM-DD.
 * @param {Map|null} options.lunar - lunarDays, or null when the option is off.
 * @param {object} options.climate - The climate settings.
 * @param {string} options.language - The language.
 * @param {number} options.ttl - Cache duration.
 * @returns {object} The content.
 */
function buildTasksWidget({ windows, today, lunar, climate, language, ttl }) {
  const garden = gardenOn(windows, today, lunar);
  const until = (window) => t('until', language, { date: formatDate(window.end, language) });
  const items = [];
  TASKS.forEach((task) => {
    const open = garden.byTask[task];
    if (open.length === 0) return;
    items.push({
      title: clip(t(`task_${task}`, language), 60),
      subtitle: clip(cropList(open, language), 60),
      badge: { text: String(open.length), color: TASK_COLORS[task] },
      description: clip(lines(open, language, until), 2000),
    });
  });
  const weekEnd = addDays(today, SOON_DAYS);
  const soon = windows.filter((window) => window.start > today && window.start <= weekEnd);
  if (soon.length > 0) {
    items.push({
      title: clip(t('widgetSoon', language), 60),
      subtitle: clip(taskCropList(soon, language), 60),
      badge: { text: String(soon.length), color: 'info' },
      description: clip(
        lines(
          soon,
          language,
          (window) => t('fromDate', language, { date: formatDate(window.start, language) }),
          true,
        ),
        2000,
      ),
    });
  }
  const ending = garden.open.filter((window) => window.end < addDays(today, SOON_DAYS));
  if (ending.length > 0) {
    items.push({
      title: clip(t('widgetClosing', language), 60),
      subtitle: clip(taskCropList(ending, language), 60),
      badge: { text: String(ending.length), color: 'danger' },
      description: clip(lines(ending, language, until, true), 2000),
    });
  }

  const components = [];
  if (garden.lunar?.avoid) {
    components.push({
      type: 'text',
      variant: 'heading',
      text: clip(t('dayToAvoid', language), 40),
    });
  } else if (garden.lunar?.type) {
    const type = t(`type_${garden.lunar.type}`, language);
    const crops = cropList(garden.favourable, language);
    components.push({
      type: 'text',
      variant: 'heading',
      text: clip(crops ? `${type} · ${crops}` : type, 40),
    });
  }
  if (items.length > 0) {
    components.push({ type: 'card-list', display: 'list', items: items.slice(0, 8) });
  } else {
    components.push({
      type: 'text',
      variant: 'body',
      text: clip(t('widgetNothing', language), 300),
    });
  }
  components.push({
    type: 'text',
    variant: 'caption',
    text: clip(climateText(climate, language), 80),
  });
  // Two texts at most: with the lunar heading and the "nothing" body, the
  // caption gives way.
  const texts = components.filter((component) => component.type === 'text');
  return {
    ttl_seconds: ttl,
    components: texts.length > 2 ? components.slice(0, -1) : components,
  };
}

/**
 * @description The "crop" widget.
 * @param {object} options - Options.
 * @param {string} options.crop - The crop key (setting).
 * @param {object[]} options.windows - The windows of the crop, from today to a year ahead.
 * @param {string} options.today - YYYY-MM-DD.
 * @param {Map|null} options.lunar - lunarDays, or null when the option is off.
 * @param {object} options.climate - The climate settings.
 * @param {string} options.language - The language.
 * @param {number} options.ttl - Cache duration.
 * @returns {object} The content.
 */
function buildCropWidget({ crop, windows, today, lunar, climate, language, ttl }) {
  const entry = cropOf(crop);
  if (!entry) {
    return {
      ttl_seconds: ttl,
      components: [{ type: 'text', variant: 'body', text: clip(t('widgetNoCrop', language), 300) }],
    };
  }
  // The current or next window of each range of each task.
  const firsts = new Map();
  windows
    .filter((window) => window.crop === crop && window.end >= today)
    .forEach((window) => {
      const range = window.id.split('-').slice(-1)[0];
      const key = `${window.task}:${range}`;
      if (!firsts.has(key) || window.start < firsts.get(key).start) firsts.set(key, window);
    });
  const rows = [...firsts.values()].sort(
    (a, b) => TASKS.indexOf(a.task) - TASKS.indexOf(b.task) || a.start.localeCompare(b.start),
  );
  const items = rows.map((window) => {
    const open = window.start <= today;
    return {
      icon: TASK_ICONS[window.task],
      label: clip(t(`task_${window.task}`, language), 40),
      value: clip(
        t('span', language, {
          from: formatDate(window.start, language),
          to: formatDate(window.end, language),
        }),
        40,
      ),
      color: open ? 'success' : 'neutral',
    };
  });
  if (lunar) {
    const open = rows.filter((window) => window.task !== 'harvest');
    const runs = open
      .flatMap((window) => favourableRuns(lunar, window, entry.type, today))
      .sort((a, b) => a.from.localeCompare(b.from))
      .filter((run, index, all) => index === 0 || run.from !== all[index - 1].from);
    items.push({
      icon: 'moon',
      label: clip(t(`days_${entry.type}`, language), 40),
      value: clip(runs.length > 0 ? runsText(runs, language, 2) : t('widgetNoLunar', language), 40),
      color: 'neutral',
    });
  }
  return {
    ttl_seconds: ttl,
    components: [
      { type: 'text', variant: 'heading', text: clip(cropName(crop, language), 40) },
      { type: 'status', items: items.slice(0, 10) },
      { type: 'text', variant: 'caption', text: clip(climateText(climate, language), 80) },
    ],
  };
}

export {
  WIDGETS,
  TTL,
  SOON_DAYS,
  TASK_COLORS,
  TASK_ICONS,
  ttlUntil,
  buildTasksWidget,
  buildCropWidget,
};

// -----------------------------------------------------------------------------
// The garden on a given day, and its words: what is open, what starts, what
// ends, what the moon favours. Shared by the calendar, the scenes and the
// widgets (pure functions).
// -----------------------------------------------------------------------------

import { TASKS, cropName, cropOf } from './crops.js';
import { addDays } from './dates.js';
import { favourableRuns, runsText, suits } from './lunar.js';
import { lastWeekOf, openOn } from './plan.js';
import { clip, formatDate, t } from './i18n.js';

/**
 * @description The garden on a day.
 * @param {object[]} windows - Windows covering the day (src/plan.js).
 * @param {string} day - YYYY-MM-DD.
 * @param {Map|null} lunar - lunarDays, or null when the option is off.
 * @returns {object} `{ day, open, byTask, opening, closing, lunar, favourable }`.
 */
function gardenOn(windows, day, lunar = null) {
  const open = openOn(windows, day);
  const byTask = Object.fromEntries(
    TASKS.map((task) => [task, open.filter((window) => window.task === task)]),
  );
  const moon = lunar?.get(day) ?? null;
  return {
    day,
    open,
    byTask,
    opening: open.filter((window) => window.start === day),
    closing: open.filter((window) => lastWeekOf(window) === day),
    lunar: moon,
    favourable: moon ? open.filter((window) => suits(moon, cropOf(window.crop).type)) : [],
  };
}

/**
 * @description Crop names of windows, without repeats: "Tomato, Basil".
 * @param {object[]} windows - Windows.
 * @param {string} language - The language.
 * @returns {string} The names.
 */
const cropList = (windows, language) =>
  [...new Set(windows.map((window) => window.crop))]
    .map((crop) => cropName(crop, language))
    .join(', ');

/**
 * @description Windows as "Tomato (Sow under cover), Leek (Harvest)".
 * @param {object[]} windows - Windows.
 * @param {string} language - The language.
 * @returns {string} The text.
 */
const taskCropList = (windows, language) =>
  windows
    .map((window) =>
      t('taskCrop', language, {
        crop: cropName(window.crop, language),
        task: t(`task_${window.task}`, language),
      }),
    )
    .join(', ');

/**
 * @description The climate in words: "Temperate zone", "Mountain zone, +1 wk,
 * southern hemisphere".
 * @param {{ zone: string, offsetWeeks: number, hemisphere: string }} climate - The climate.
 * @param {string} language - The language.
 * @returns {string} The text.
 */
function climateText(climate, language) {
  const parts = [t(`zone_${climate.zone}`, language)];
  if (climate.offsetWeeks !== 0) {
    parts.push(
      t('offsetWeeks', language, {
        sign: climate.offsetWeeks > 0 ? '+' : '−',
        weeks: Math.abs(climate.offsetWeeks),
      }),
    );
  }
  if (climate.hemisphere === 'south') parts.push(t('southern', language));
  return parts.join(', ');
}

/**
 * @description The favourable lunar days of a window, in words.
 * @param {object} window - The window.
 * @param {Map|null} lunar - lunarDays, or null.
 * @param {string} language - The language.
 * @param {string} [from] - Days before are skipped (today).
 * @returns {string} The sentence, empty when the option is off.
 */
function lunarText(window, lunar, language, from = window.start) {
  if (!lunar) return '';
  const type = cropOf(window.crop).type;
  const label = t(`days_${type}`, language);
  // German nouns keep their capital; "Jours racines" starts the French sentence.
  const lower = language === 'de' ? label : label.toLowerCase();
  const runs = favourableRuns(lunar, window, type, from);
  if (runs.length === 0) {
    return t('noFavourableDays', language, { days: lower });
  }
  return t('favourableDays', language, {
    days: language === 'fr' || language === 'es' ? label : lower,
    list: runsText(runs, language),
  });
}

/**
 * @description The summary of a day, for a message.
 * @param {object} garden - gardenOn.
 * @param {'today'|'tomorrow'} when - Which day it is.
 * @param {string} language - The language.
 * @returns {string} The summary.
 */
function summaryText(garden, when, language) {
  const parts = [];
  if (garden.open.length === 0) {
    parts.push(t(`summaryNone_${when}`, language));
  } else {
    TASKS.forEach((task) => {
      if (garden.byTask[task].length > 0) {
        parts.push(
          t('summaryTask', language, {
            task: t(`task_${task}`, language),
            crops: cropList(garden.byTask[task], language),
          }),
        );
      }
    });
  }
  if (garden.opening.length > 0) {
    parts.push(
      t(`summaryOpening_${when}`, language, { list: taskCropList(garden.opening, language) }),
    );
  }
  if (garden.closing.length > 0) {
    parts.push(t('summaryClosing', language, { list: taskCropList(garden.closing, language) }));
  }
  if (garden.lunar?.avoid) {
    parts.push(t('summaryAvoid', language));
  } else if (garden.lunar?.type) {
    const type = t(`type_${garden.lunar.type}`, language);
    parts.push(
      garden.favourable.length > 0
        ? t('summaryLunar', language, { type, crops: cropList(garden.favourable, language) })
        : t('summaryLunarNone', language, { type }),
    );
  }
  return parts.join(' ');
}

/**
 * @description Everything a scene gets about a day (flat, scalars only): the
 * variables of `daily_summary` and the outputs of `get_garden_tasks`.
 * @param {object} garden - gardenOn.
 * @param {'today'|'tomorrow'} when - Which day it is.
 * @param {string} language - The language of the texts.
 * @returns {object} The values.
 */
function dayValues(garden, when, language) {
  const lists = Object.fromEntries(
    TASKS.map((task) => [task, clip(cropList(garden.byTask[task], language), 1000)]),
  );
  const lunar = garden.lunar;
  return {
    date: garden.day,
    ...lists,
    task_count: garden.open.length,
    opening: clip(taskCropList(garden.opening, language), 1000),
    has_opening: garden.opening.length > 0 ? 'yes' : 'no',
    closing: clip(taskCropList(garden.closing, language), 1000),
    day_type: lunar?.type ?? '',
    day_type_label: lunar?.type ? t(`type_${lunar.type}`, language) : '',
    avoid: lunar ? (lunar.avoid ? 'yes' : 'no') : '',
    favourable: clip(cropList(garden.favourable, language), 1000),
    summary: clip(summaryText(garden, when, language), 1000),
  };
}

/**
 * @description The data of a `window_opened` or `window_closing` scene event.
 * @param {object} window - The window.
 * @param {'opened'|'closing'} kind - Which event.
 * @param {Map|null} lunar - lunarDays, or null.
 * @param {string} today - YYYY-MM-DD.
 * @param {string} language - The language of the texts.
 * @returns {object} The data (flat, scalars only).
 */
function windowValues(window, kind, lunar, today, language) {
  const crop = cropName(window.crop, language);
  const task = t(`task_${window.task}`, language);
  const end = formatDate(window.end, language);
  const moon = lunarText(window, lunar, language, today);
  return {
    crop: window.crop,
    crop_label: crop,
    task: window.task,
    task_label: task,
    start: window.start,
    end: window.end,
    end_label: end,
    lunar_days: clip(moon, 1000),
    summary: clip([t(kind, language, { task, crop, end }), moon].filter(Boolean).join(' '), 1000),
  };
}

/**
 * @description The day after a day, for "tomorrow".
 * @param {string} day - YYYY-MM-DD.
 * @returns {string} YYYY-MM-DD.
 */
const nextDay = (day) => addDays(day, 1);

export {
  gardenOn,
  cropList,
  taskCropList,
  climateText,
  lunarText,
  summaryText,
  dayValues,
  windowValues,
  nextDay,
};

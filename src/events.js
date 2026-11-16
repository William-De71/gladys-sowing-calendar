// -----------------------------------------------------------------------------
// Scene triggers and scene action of the sowing calendar.
//
// Triggers (keys are forever), all fired once a day at the event hour of the
// configuration (src/app.js), remembered in /data:
//   - `daily_summary`    every day, with what to do in the garden that day
//                        (filters: a window opens, the lunar day type);
//   - `window_opened`    for each window that opens that day (filters: the
//                        task, the crop);
//   - `window_closing`   for each window entering its last week (filters:
//                        the task, the crop).
//
// Action `get_garden_tasks`: the garden of today or tomorrow, as values and as
// a sentence to send in a message.
// -----------------------------------------------------------------------------

import { dayValues, gardenOn, nextDay, windowValues } from './garden.js';

const TRIGGERS = {
  DAILY_SUMMARY: 'daily_summary',
  WINDOW_OPENED: 'window_opened',
  WINDOW_CLOSING: 'window_closing',
};
const SCENE_ACTIONS = { GET_GARDEN_TASKS: 'get_garden_tasks' };
const WHEN = ['today', 'tomorrow'];

/**
 * @description The scene events of a day, in order: the daily summary, then
 * one per window opening, then one per window entering its last week. Each
 * has a key, remembered once published.
 * @param {object[]} windows - Windows covering the day.
 * @param {string} day - YYYY-MM-DD.
 * @param {Map|null} lunar - lunarDays, or null.
 * @param {string} language - The language of the texts.
 * @returns {Array<{ key: string, trigger: string, data: object }>} The events.
 */
function eventsOfDay(windows, day, lunar, language) {
  const garden = gardenOn(windows, day, lunar);
  return [
    {
      key: 'daily',
      trigger: TRIGGERS.DAILY_SUMMARY,
      data: dayValues(garden, 'today', language),
    },
    ...garden.opening.map((window) => ({
      key: `opened:${window.id}`,
      trigger: TRIGGERS.WINDOW_OPENED,
      data: windowValues(window, 'opened', lunar, day, language),
    })),
    ...garden.closing.map((window) => ({
      key: `closing:${window.id}`,
      trigger: TRIGGERS.WINDOW_CLOSING,
      data: windowValues(window, 'closing', lunar, day, language),
    })),
  ];
}

/**
 * @description The outputs of the get_garden_tasks scene action.
 * @param {object[]} windows - Windows covering today and tomorrow.
 * @param {string} today - YYYY-MM-DD.
 * @param {object} fields - `{ day: 'today'|'tomorrow' }`.
 * @param {Map|null} lunar - lunarDays, or null.
 * @param {string} language - The language of the texts.
 * @returns {object} The outputs.
 */
function gardenTasksOutputs(windows, today, fields, lunar, language) {
  const when = WHEN.includes(fields?.day) ? fields.day : 'today';
  const day = when === 'tomorrow' ? nextDay(today) : today;
  return dayValues(gardenOn(windows, day, lunar), when, language);
}

export { TRIGGERS, SCENE_ACTIONS, WHEN, eventsOfDay, gardenTasksOutputs };

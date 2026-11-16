// -----------------------------------------------------------------------------
// The garden plan: the windows of each crop and task as real dates, for the
// climate of the house.
//
// The table of src/crops.js holds the dates of the reference climate
// (temperate). They are moved:
//   - by the climate zone: a warm climate starts the spring earlier and ends
//     the season later, a cold one the reverse. A date of the first half of
//     the year (up to July 15) takes the spring shift, a later one the autumn
//     shift: the season stretches or shrinks instead of sliding as a block;
//   - by the offset of the configuration, in weeks, on every date (a frost
//     pocket, a sheltered walled garden);
//   - by six months in the southern hemisphere (the shift of the zone still
//     follows the season of the reference date).
// A window keeps at least a week, whatever the shifts.
//
// A window is identified by `<crop>-<task>-<year>-<range>`: the crop, the
// task, the year of the reference start and the position of the range in the
// task. The id never holds a date: a new zone or offset moves the dates of
// the calendar events, it never duplicates them.
// -----------------------------------------------------------------------------

import { CROPS, TASKS, cropOf, parseRanges } from './crops.js';
import { addDays } from './dates.js';

const ZONES = {
  mediterranean: { spring: -21, autumn: 21 },
  oceanic: { spring: -7, autumn: 14 },
  temperate: { spring: 0, autumn: 0 },
  continental: { spring: 7, autumn: -7 },
  mountain: { spring: 21, autumn: -21 },
};
const ZONE_KEYS = Object.keys(ZONES);
const HEMISPHERES = ['north', 'south'];
const OFFSET_WEEKS = { min: -4, max: 4, default: 0 };
const MIN_WINDOW_DAYS = 7;
// The last half-month of the spring: July 1-15.
const LAST_SPRING_HALF = 12;

// Every range of every crop, read once.
const RANGES = new Map(
  CROPS.map((entry) => [
    entry.key,
    Object.fromEntries(
      Object.entries(entry.tasks).map(([task, text]) => [task, parseRanges(text)]),
    ),
  ]),
);

/**
 * @description The number of days of a month.
 * @param {number} year - The year.
 * @param {number} month - 1 to 12.
 * @returns {number} 28 to 31.
 */
const daysIn = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

/**
 * @description The first or last day of a half-month, the index past 23
 * running into the next years.
 * @param {number} year - The year of index 0.
 * @param {number} index - Half-month index (0 = January 1-15).
 * @param {'first'|'last'} edge - Which day.
 * @returns {string} YYYY-MM-DD.
 */
function halfDay(year, index, edge) {
  const y = year + Math.floor(index / 24);
  const half = ((index % 24) + 24) % 24;
  const month = Math.floor(half / 2) + 1;
  const second = half % 2 === 1;
  let day;
  if (edge === 'first') day = second ? 16 : 1;
  else day = second ? daysIn(y, month) : 15;
  return `${String(y).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * @description The climate settings, read from the normalized configuration.
 * @param {object} [config] - `{ zone, hemisphere, offsetWeeks }`.
 * @returns {{ zone: string, hemisphere: string, offsetWeeks: number }} The settings.
 */
function climateOf(config = {}) {
  return {
    zone: ZONE_KEYS.includes(config.zone) ? config.zone : 'temperate',
    hemisphere: HEMISPHERES.includes(config.hemisphere) ? config.hemisphere : 'north',
    offsetWeeks: Number.isInteger(config.offsetWeeks) ? config.offsetWeeks : 0,
  };
}

/**
 * @description The shift of a reference date, in days.
 * @param {number} index - Half-month index of the reference date (northern).
 * @param {object} climate - The climate settings.
 * @returns {number} Days.
 */
function shiftOf(index, climate) {
  const zone = ZONES[climate.zone];
  const season = index % 24 <= LAST_SPRING_HALF ? zone.spring : zone.autumn;
  return season + climate.offsetWeeks * 7;
}

/**
 * @description One window of a range, for one reference year.
 * @param {string} crop - The crop key.
 * @param {string} task - The task.
 * @param {number} position - The position of the range in the task.
 * @param {{ from: number, to: number }} range - The range.
 * @param {number} year - The reference year (of the start).
 * @param {object} climate - The climate settings.
 * @returns {{ id: string, crop: string, task: string, start: string, end: string }} The window, `end` included.
 */
function windowOf(crop, task, position, range, year, climate) {
  const from = range.from;
  const to = range.to < range.from ? range.to + 24 : range.to;
  const months = climate.hemisphere === 'south' ? 12 : 0;
  const start = addDays(halfDay(year, from + months, 'first'), shiftOf(from, climate));
  let end = addDays(halfDay(year, to + months, 'last'), shiftOf(to, climate));
  if (end < addDays(start, MIN_WINDOW_DAYS - 1)) {
    end = addDays(start, MIN_WINDOW_DAYS - 1);
  }
  return { id: `${crop}-${task}-${year}-${position}`, crop, task, start, end };
}

/**
 * @description The windows of some crops that touch a span of days.
 * @param {string[]} crops - Crop keys (unknown ones are skipped).
 * @param {object} climate - The climate settings (climateOf).
 * @param {string} from - First day (YYYY-MM-DD).
 * @param {string} to - Last day (YYYY-MM-DD, included).
 * @param {string[]} [tasks] - The tasks wanted.
 * @returns {object[]} The windows, by start, then crop order, then task order.
 * @example
 * windowsBetween(['tomato'], climateOf(), '2027-01-01', '2027-12-31');
 */
function windowsBetween(crops, climate, from, to, tasks = TASKS) {
  const firstYear = Number(from.slice(0, 4)) - 2;
  const lastYear = Number(to.slice(0, 4)) + 1;
  const windows = [];
  crops.forEach((crop) => {
    const ranges = RANGES.get(crop);
    if (!ranges) return;
    TASKS.filter((task) => tasks.includes(task) && ranges[task]).forEach((task) => {
      ranges[task].forEach((range, position) => {
        for (let year = firstYear; year <= lastYear; year += 1) {
          const window = windowOf(crop, task, position, range, year, climate);
          if (window.end >= from && window.start <= to) {
            windows.push(window);
          }
        }
      });
    });
  });
  const cropOrder = (key) => CROPS.indexOf(cropOf(key));
  return windows.sort(
    (a, b) =>
      a.start.localeCompare(b.start) ||
      cropOrder(a.crop) - cropOrder(b.crop) ||
      TASKS.indexOf(a.task) - TASKS.indexOf(b.task),
  );
}

/**
 * @description The windows open on a day.
 * @param {object[]} windows - Windows (windowsBetween).
 * @param {string} day - YYYY-MM-DD.
 * @returns {object[]} The windows.
 */
const openOn = (windows, day) => windows.filter((w) => w.start <= day && w.end >= day);

/**
 * @description The day a window enters its last week (the closing reminder):
 * none for a window of less than two weeks, which the opening announces.
 * @param {object} window - A window.
 * @returns {string|null} YYYY-MM-DD.
 */
function lastWeekOf(window) {
  const lastWeek = addDays(window.end, -6);
  return lastWeek > addDays(window.start, 6) ? lastWeek : null;
}

/**
 * @description The days left in a window, from a day (that day included).
 * @param {object} window - A window.
 * @param {string} day - YYYY-MM-DD.
 * @returns {number} Days.
 */
function daysLeft(window, day) {
  const [y1, m1, d1] = day.split('-').map(Number);
  const [y2, m2, d2] = window.end.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000) + 1;
}

export {
  ZONES,
  ZONE_KEYS,
  HEMISPHERES,
  OFFSET_WEEKS,
  MIN_WINDOW_DAYS,
  halfDay,
  climateOf,
  shiftOf,
  windowOf,
  windowsBetween,
  openOn,
  lastWeekOf,
  daysLeft,
};

// -----------------------------------------------------------------------------
// The lunar option: which days of a window suit a crop, by the lunar
// gardening calendar (Maria Thun method), computed by src/almanac.js (the
// same computation as gladys-lunar-gardening-calendar, checked day by day
// against a published calendar).
//
// A day suits a crop when the main day type of the day (the longest in the
// local day) is the type of the crop (carrot: root days) and it is not a day
// to avoid (perigee, apogee, lunar node, eclipse). Off by default: the almanac
// is computed only when the option is on (about a second for a year).
// -----------------------------------------------------------------------------

import { describeDay } from './almanac.js';
import { addDays } from './dates.js';
import { formatDate, formatDateRange } from './i18n.js';
import { localMidnight } from './time.js';

/**
 * @description The lunar days of a span, by local day.
 * @param {Function} almanac - `(from, to) => almanac` covering the span (ms).
 * @param {string} from - First day, YYYY-MM-DD.
 * @param {string} to - Last day, YYYY-MM-DD (included).
 * @param {string} timezone - IANA timezone of the house.
 * @returns {Map<string, { type: string|null, trajectory: string|null, avoid: boolean }>} The days.
 */
function lunarDays(almanac, from, to, timezone) {
  const days = new Map();
  const book = almanac(localMidnight(from, timezone), localMidnight(addDays(to, 1), timezone));
  for (let day = from; day <= to; day = addDays(day, 1)) {
    const info = describeDay(book, day, timezone);
    days.set(day, {
      type: info.type,
      trajectory: info.trajectory,
      avoid: info.unfavourable.length > 0,
    });
  }
  return days;
}

/**
 * @description True when a day suits a crop type.
 * @param {object|undefined} lunar - A day of lunarDays.
 * @param {string} type - fruit, root, flower or leaf.
 * @returns {boolean} True when favourable.
 */
const suits = (lunar, type) => Boolean(lunar && lunar.type === type && !lunar.avoid);

/**
 * @description The favourable days of a window from a day on, as runs of
 * consecutive days.
 * @param {Map} days - lunarDays.
 * @param {{ start: string, end: string }} window - The window.
 * @param {string} type - The type of the crop.
 * @param {string} [from] - Days before are skipped (today).
 * @returns {Array<{ from: string, to: string }>} The runs.
 */
function favourableRuns(days, window, type, from = window.start) {
  const runs = [];
  const first = window.start > from ? window.start : from;
  for (let day = first; day <= window.end; day = addDays(day, 1)) {
    if (!days.has(day)) continue;
    if (!suits(days.get(day), type)) continue;
    const last = runs[runs.length - 1];
    if (last && addDays(last.to, 1) === day) last.to = day;
    else runs.push({ from: day, to: day });
  }
  return runs;
}

/**
 * @description Runs of days in words: "Nov 18 – 19, Nov 27".
 * @param {Array<{ from: string, to: string }>} runs - The runs.
 * @param {string} language - The language.
 * @param {number} [max] - At most this many runs.
 * @returns {string} The text, empty without runs.
 */
function runsText(runs, language, max = 6) {
  const parts = runs.slice(0, max).map((run) => {
    if (run.from === run.to) return formatDate(run.from, language);
    return formatDateRange(run.from, run.to, language);
  });
  if (runs.length > max) parts.push('…');
  return parts.join(', ');
}

export { lunarDays, suits, favourableRuns, runsText };

// -----------------------------------------------------------------------------
// Configuration of the sowing calendar.
//
// Fields of the config_schema:
//   - `crops`           the crops of the garden (multi_select of src/crops.js);
//                       never set: the default ones; set empty: none;
//   - `zone`            the climate zone (src/plan.js), default temperate;
//   - `offset_weeks`    weeks added to every date (-4 to 4), default 0;
//   - `hemisphere`      north (default) or south (six months later);
//   - `calendar_tasks`  the tasks shown in the calendar (default all four);
//   - `lunar`           the favourable days of the lunar gardening calendar
//                       (default off);
//   - `event_hour`      local hour (0-23) of the daily scene events;
//   - `language`        language of the texts Gladys does not ask for in a
//                       language (scene texts, status): `auto` follows the
//                       language of the last widget request, and guesses it
//                       from the timezone of Gladys until a widget is shown.
// -----------------------------------------------------------------------------

import { CROPS, DEFAULT_CROPS, TASKS } from './crops.js';
import { isLanguage } from './i18n.js';
import { HEMISPHERES, OFFSET_WEEKS, ZONE_KEYS } from './plan.js';

const EVENT_HOUR = { min: 0, max: 23, default: 7 };
const AUTO_LANGUAGE = 'auto';
const CROP_KEYS = CROPS.map((entry) => entry.key);

/**
 * @description Read a bounded whole number, falling back to its default.
 * @param {unknown} raw - The raw value (the form can send numbers as strings).
 * @param {{ min: number, max: number, default: number }} bounds - The bounds.
 * @returns {number} The value.
 * @example
 * readNumber('8', EVENT_HOUR); // -> 8
 */
function readNumber(raw, bounds) {
  if (raw === '' || raw === null || raw === undefined) {
    return bounds.default;
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return bounds.default;
  }
  return Math.min(bounds.max, Math.max(bounds.min, Math.round(value)));
}

/**
 * @description Read a boolean, falling back to its default.
 * @param {unknown} raw - The raw value (true, 'true', 1…).
 * @param {boolean} fallback - The default.
 * @returns {boolean} The value.
 */
function readBoolean(raw, fallback) {
  if (raw === true || raw === 'true' || raw === 1 || raw === '1') return true;
  if (raw === false || raw === 'false' || raw === 0 || raw === '0') return false;
  return fallback;
}

/**
 * @description Read a multi_select: an array, or its JSON text; never set ->
 * the default; the unknown values are dropped, the order of `known` is kept.
 * @param {unknown} raw - The raw value.
 * @param {string[]} known - The values allowed, in order.
 * @param {string[]} fallback - The default.
 * @returns {string[]} The values.
 */
function readList(raw, known, fallback) {
  let list = raw;
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw);
    } catch {
      list = raw.split(',').map((value) => value.trim());
    }
  }
  if (!Array.isArray(list)) return [...fallback];
  return known.filter((value) => list.includes(value));
}

/**
 * @description Normalize the raw config object from the host API.
 * @param {object} [rawConfig] - The raw config values.
 * @returns {{ crops: string[], zone: string, offsetWeeks: number, hemisphere: string,
 *   calendarTasks: string[], lunar: boolean, eventHour: number, language: string }} The config.
 * @example
 * normalizeConfig({ zone: 'mountain' });
 */
function normalizeConfig(rawConfig = {}) {
  const config = rawConfig ?? {};
  return {
    crops: readList(config.crops, CROP_KEYS, DEFAULT_CROPS),
    zone: ZONE_KEYS.includes(config.zone) ? config.zone : 'temperate',
    offsetWeeks: readNumber(config.offset_weeks, OFFSET_WEEKS),
    hemisphere: HEMISPHERES.includes(config.hemisphere) ? config.hemisphere : 'north',
    calendarTasks: readList(config.calendar_tasks, TASKS, TASKS),
    lunar: readBoolean(config.lunar, false),
    eventHour: readNumber(config.event_hour, EVENT_HOUR),
    language: isLanguage(config.language) ? config.language : AUTO_LANGUAGE,
  };
}

// Timezones of the countries speaking one of the languages of the
// integration; any other one is English. A guess until the first widget
// gives the real language.
const TIMEZONE_LANGUAGES = {
  fr: [
    'Europe/Paris',
    'Europe/Monaco',
    'Europe/Brussels',
    'Europe/Luxembourg',
    'Indian/Reunion',
    'Indian/Mayotte',
    'America/Guadeloupe',
    'America/Martinique',
    'America/Cayenne',
    'America/Miquelon',
    'America/St_Barthelemy',
    'America/Marigot',
    'Pacific/Noumea',
    'Pacific/Tahiti',
    'Pacific/Wallis',
    'America/Montreal',
    'Africa/Abidjan',
    'Africa/Dakar',
    'Africa/Casablanca',
    'Africa/Algiers',
    'Africa/Tunis',
  ],
  de: ['Europe/Berlin', 'Europe/Busingen', 'Europe/Vienna', 'Europe/Zurich', 'Europe/Vaduz'],
  es: [
    'Europe/Madrid',
    'Atlantic/Canary',
    'Africa/Ceuta',
    'America/Mexico_City',
    'America/Bogota',
    'America/Lima',
    'America/Santiago',
    'America/Caracas',
    'America/Montevideo',
    'America/Asuncion',
    'America/La_Paz',
    'America/Guayaquil',
    'America/Havana',
    'America/Panama',
    'America/Costa_Rica',
    'America/Guatemala',
    'America/El_Salvador',
    'America/Tegucigalpa',
    'America/Managua',
    'America/Santo_Domingo',
    'America/Puerto_Rico',
  ],
};

/**
 * @description The language of the texts guessed from a timezone.
 * @param {string} timezone - IANA timezone of Gladys.
 * @returns {string} en, fr, de or es.
 * @example
 * guessLanguage('Europe/Paris'); // -> 'fr'
 */
function guessLanguage(timezone) {
  const zone = String(timezone ?? '');
  if (zone.startsWith('America/Argentina/')) return 'es';
  const found = Object.entries(TIMEZONE_LANGUAGES).find(([, zones]) => zones.includes(zone));
  return found ? found[0] : 'en';
}

export {
  EVENT_HOUR,
  AUTO_LANGUAGE,
  CROP_KEYS,
  readNumber,
  readBoolean,
  readList,
  normalizeConfig,
  guessLanguage,
};

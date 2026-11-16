// -----------------------------------------------------------------------------
// The sowing calendar in the Gladys calendar (manifest `type: "calendar"`).
//
// Every user who enabled the integration in "My calendars" gets one calendar,
// "Sowing calendar", in the user's language, from 7 days back to 366 days
// ahead: one all-day event per window of a crop and a task ("Sow under
// cover: Tomato", February 16 -> April 15), with the dates, the climate, the
// advice of the task and, with the lunar option, the favourable days of the
// window in its description. The tasks shown follow the configuration.
// Pushed at connection, when an account or the configuration changes, and at
// midnight (the window slides). The window of the push starts 30 days back:
// the core prunes only inside the window, so the old events are deleted as
// they leave, instead of piling up. The calendar is private when created: the
// user shares it with the household (and the scenes) from "My calendars".
//
// Limits of the core: 500 events per request (every crop and task of the
// table makes about 200 windows a year), 30 calendar writes per minute per
// integration (writes are spaced by 2.1 s).
//
// External ids: ext:<selector>:<user>:sowing                               (calendar)
//               ext:<selector>:<user>:<crop>-<task>-<year>-<range>         (window)
// The id of a window never holds a date: a new climate moves the event, it
// never duplicates it.
// -----------------------------------------------------------------------------

import { addDays } from './dates.js';
import { cropName } from './crops.js';
import { climateText, lunarText } from './garden.js';
import { clip, formatDate, t } from './i18n.js';

const HISTORY_DAYS = 7;
const PRUNE_DAYS = 30;
const AHEAD_DAYS = 366;
const WRITE_SPACING_MS = 2100;
const MAX_EVENTS = 500;
const COLOR = '#5c940d';

/**
 * @description The external id of the calendar of a user.
 * @param {object} gladys - SDK client.
 * @param {string} user - User selector.
 * @returns {string} The external id.
 */
const calendarId = (gladys, user) => gladys.externalId(`${user}:sowing`);

/**
 * @description The events of some windows, in a language.
 * @param {object} gladys - SDK client.
 * @param {string} user - User selector.
 * @param {object} options - Options.
 * @param {object[]} options.windows - The windows (src/plan.js).
 * @param {object} options.climate - The climate settings.
 * @param {Map|null} options.lunar - lunarDays, or null when the option is off.
 * @param {string} options.language - The user's language.
 * @returns {object[]} The events, 500 at most.
 */
function buildEvents(gladys, user, { windows, climate, lunar, language }) {
  const where = climateText(climate, language);
  return windows.slice(0, MAX_EVENTS).map((window) => {
    const crop = cropName(window.crop, language);
    const task = t(`task_${window.task}`, language);
    const description = [
      t('eventWhen', language, {
        crop,
        task: task.toLowerCase(),
        from: formatDate(window.start, language),
        to: formatDate(window.end, language),
        climate: where,
      }),
      t(`advice_${window.task}`, language),
      lunarText(window, lunar, language),
    ]
      .filter(Boolean)
      .join('\n\n');
    return {
      external_id: gladys.externalId(`${user}:${window.id}`),
      name: clip(t('eventName', language, { task, crop }), 200),
      description: clip(description, 1000),
      start: window.start,
      end: addDays(window.end, 1),
      full_day: true,
    };
  });
}

/**
 * @description Create the calendar synchronizer.
 * @param {object} gladys - SDK client.
 * @param {object} options - Dependencies.
 * @param {Function} options.today - `() => 'YYYY-MM-DD'`.
 * @param {Function} options.plan - `(from, to) => { windows, climate, lunar }`: the
 *   windows of the calendar touching the span (YYYY-MM-DD, included), the climate and the
 *   lunar days (null when off).
 * @param {Function} [options.sleep] - Delay between two writes.
 * @param {object} [options.logger] - SDK logger.
 * @returns {{ syncAll: Function, syncUser: Function, forget: Function }} The synchronizer.
 */
function createCalendarSync(gladys, { today, plan, sleep = defaultSleep, logger }) {
  // Last content pushed per calendar: an unchanged calendar is not pushed again.
  const pushed = new Map();
  let lastWrite = 0;
  let queue = Promise.resolve();

  const write = async (call) => {
    const wait = lastWrite + WRITE_SPACING_MS - Date.now();
    if (wait > 0) {
      await sleep(wait);
    }
    lastWrite = Date.now();
    return call();
  };

  const syncAccount = async (account, { force = false } = {}) => {
    const user = account.user.selector;
    const language = account.user.language;
    const id = calendarId(gladys, user);
    const calendar = {
      external_id: id,
      name: t('calendarName', language),
      description: t('calendarDescription', language),
      color: COLOR,
    };
    const calendarKey = JSON.stringify(calendar);
    if (force || pushed.get(`calendar:${user}`) !== calendarKey) {
      await write(() => gladys.publishCalendars(user, [calendar]));
      pushed.set(`calendar:${user}`, calendarKey);
    }
    const mine = (await gladys.getCalendars(user)).find((c) => c.external_id === id);
    if (mine && mine.sync === false) {
      return;
    }
    const to = addDays(today(), AHEAD_DAYS);
    const window = { from: addDays(today(), -PRUNE_DAYS), to };
    const span = { from: addDays(today(), -HISTORY_DAYS), to };
    const events = buildEvents(gladys, user, {
      ...plan(span.from, addDays(span.to, -1)),
      language,
    });
    const content = JSON.stringify([window, events]);
    if (!force && pushed.get(id) === content) {
      return;
    }
    try {
      await write(() => gladys.publishCalendarEvents(id, events, window));
      pushed.set(id, content);
    } catch (error) {
      // The user turned the sync of this calendar off meanwhile.
      if (error?.status === 403) {
        logger?.info(`calendar of ${user} not synchronized: ${error.message}`);
        return;
      }
      throw error;
    }
  };

  const enqueue = (job) => {
    const result = queue.then(job);
    queue = result.catch((error) => logger?.warn(`calendar sync failed: ${error.message}`));
    return result;
  };

  return {
    /**
     * @param {object} [options] - `{ force }`: push even what did not change.
     * @returns {Promise<void>} Every enabled user synchronized.
     */
    syncAll: (options) =>
      enqueue(async () => {
        for (const account of await gladys.getCalendarAccounts()) {
          await syncAccount(account, options);
        }
      }),
    /**
     * @param {string} userSelector - The user whose account changed.
     * @returns {Promise<void>} That user synchronized (nothing if disabled).
     */
    syncUser: (userSelector) =>
      enqueue(async () => {
        const account = (await gladys.getCalendarAccounts()).find(
          (candidate) => candidate.user.selector === userSelector,
        );
        if (account) {
          await syncAccount(account, { force: true });
        } else {
          // Disabled: the core already deleted the calendar.
          pushed.delete(`calendar:${userSelector}`);
          pushed.delete(calendarId(gladys, userSelector));
        }
      }),
    /** Forget what was pushed (reconnection: the core may have changed meanwhile). */
    forget: () => pushed.clear(),
  };
}

/**
 * @param {number} ms - Delay.
 * @returns {Promise<void>} Resolved after the delay.
 */
function defaultSleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms).unref?.();
  });
}

export {
  MAX_EVENTS,
  HISTORY_DAYS,
  PRUNE_DAYS,
  AHEAD_DAYS,
  WRITE_SPACING_MS,
  calendarId,
  buildEvents,
  createCalendarSync,
};

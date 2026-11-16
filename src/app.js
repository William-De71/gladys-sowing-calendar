// -----------------------------------------------------------------------------
// The sowing calendar: every handler, registered on a Gladys client.
//
// A calendar integration (manifest `type: "calendar"`): a "Sowing calendar"
// for every user who enabled it in "My calendars" (src/calendar.js), three
// scene triggers and a scene action (src/events.js), two dashboard widgets
// (src/widgets.js). Everything comes from the table of src/crops.js, moved
// for the climate of the house (src/plan.js), and with the lunar option from
// the almanac computed locally (src/almanac.js): no network, no key, no
// account.
//
// The clock ticks every 30 s: a new local day pushes the calendars (the
// window slides) and refreshes the widgets; the event hour fires the scene
// events of the day.
//
// index.js only creates the SDK client; the tests drive this module with the
// fake Gladys of the SDK (test/app.test.js).
// -----------------------------------------------------------------------------

import { logger as sdkLogger } from '@gladysassistant/integration-sdk';
import { createAlmanac } from './almanac.js';
import { normalizeConfig, guessLanguage, AUTO_LANGUAGE } from './config.js';
import { createStore, DEFAULT_PATH } from './store.js';
import { createCalendarSync } from './calendar.js';
import { SCENE_ACTIONS, eventsOfDay, gardenTasksOutputs } from './events.js';
import { WIDGETS, SOON_DAYS, ttlUntil, buildTasksWidget, buildCropWidget } from './widgets.js';
import { climateOf, openOn, windowsBetween } from './plan.js';
import { lunarDays } from './lunar.js';
import { climateText } from './garden.js';
import { addDays } from './dates.js';
import { all, isLanguage, t } from './i18n.js';
import { resolveTimezone, localDay, secondsUntilMidnight, wallClock } from './time.js';

const TICK_MS = 30000;
const DEFAULT_WIDGET_CROP = 'tomato';

/**
 * @description Register every handler of the integration on a Gladys client.
 * @param {object} gladys - A GladysIntegration (or the fake Gladys of the SDK).
 * @param {object} [options] - Options.
 * @param {Function} [options.now] - `() => Date` (tests).
 * @param {string} [options.timezone] - IANA timezone (default: TZ).
 * @param {string|null} [options.statePath] - File of the state (null: memory).
 * @param {Function} [options.sleep] - `(ms) => Promise` (tests).
 * @param {number} [options.tickMs] - Clock period, 0 for none (tests).
 * @param {object} [options.logger] - Logger.
 * @returns {{ tick: Function, stop: Function }} Handles for the tests.
 * @example
 * createApp(new GladysIntegration());
 */
function createApp(
  gladys,
  {
    now = () => new Date(),
    timezone = resolveTimezone(),
    statePath = DEFAULT_PATH,
    sleep,
    tickMs = TICK_MS,
    logger = sdkLogger,
  } = {},
) {
  const store = createStore({ path: statePath, logger });
  const almanac = createAlmanac({ timezone });
  let config = normalizeConfig();
  let lastDay = null;
  let timer = null;
  let running = Promise.resolve();
  let lastStatus = null;

  const today = () => localDay(now(), timezone);
  const climate = () => climateOf(config);
  const textLanguage = () =>
    config.language === AUTO_LANGUAGE
      ? (store.language() ?? guessLanguage(timezone))
      : config.language;
  // The lunar days of a span, only with the option on.
  const lunar = (from, to) =>
    config.lunar ? lunarDays((a, b) => almanac.get(a, b), from, to, timezone) : null;
  // The windows of the crops of the configuration, every task.
  const windows = (from, to, crops = config.crops) => windowsBetween(crops, climate(), from, to);

  const calendarSync = createCalendarSync(gladys, {
    today,
    plan: (from, to) => ({
      windows: windowsBetween(config.crops, climate(), from, to, config.calendarTasks),
      climate: climate(),
      lunar: lunar(from, to),
    }),
    ...(sleep ? { sleep } : {}),
    logger,
  });

  /** @description Ask Gladys to fetch the widgets again. */
  function refreshWidgets() {
    if (!gladys.connected) return;
    for (const key of Object.values(WIDGETS)) {
      try {
        gladys.requestWidgetRefresh(key);
      } catch (err) {
        logger.warn(`Unable to refresh the widget ${key}: ${err.message}`);
      }
    }
  }

  /** @description Show the climate and the work of the day in the Configuration screen. */
  async function reportStatus() {
    const day = today();
    const count = openOn(windows(day, day), day).length;
    const message = all('statusRunning', (language) => ({
      crops: config.crops.length,
      climate: climateText(climate(), language).toLowerCase(),
      tasks: t('statusTasks', language, { count }),
    }));
    const signature = JSON.stringify(message);
    if (!gladys.connected || signature === lastStatus) return;
    lastStatus = signature;
    try {
      await gladys.setConnectionStatus(true, message);
    } catch (err) {
      lastStatus = null;
      logger.error('Unable to report the status', err);
    }
  }

  /**
   * @description Fire the scene events of the day, once the event hour is
   * reached; a refused event is fired again at the next tick, a published one
   * never again.
   * @param {string} day - YYYY-MM-DD.
   */
  async function fireDaily(day) {
    if (!gladys.connected) return;
    if (wallClock(now(), timezone).hour < config.eventHour) return;
    const fired = store.fired(day);
    const events = eventsOfDay(windows(day, day), day, lunar(day, day), textLanguage());
    for (const event of events) {
      if (fired.includes(event.key)) continue;
      try {
        await gladys.publishSceneEvent(event.trigger, event.data);
        store.addFired(day, event.key);
      } catch (err) {
        logger.warn(`Scene event ${event.trigger} of ${day} refused: ${err.message}`);
      }
    }
  }

  /**
   * @description One look at the clock: a new day pushes the calendars and
   * refreshes the widgets, the event hour fires the scene events. Never two
   * at once.
   * @returns {Promise<void>}
   */
  function tick() {
    running = running.then(async () => {
      const day = today();
      if (day !== lastDay) {
        lastDay = day;
        await calendarSync.syncAll();
        refreshWidgets();
        await reportStatus();
      }
      await fireDaily(day);
    });
    running = running.catch((err) => logger.error('Clock round failed', err));
    return running;
  }

  /**
   * @description Apply a configuration: the calendars follow what they show.
   * @param {object} raw - The raw configuration.
   */
  async function applyConfig(raw) {
    config = normalizeConfig(raw ?? {});
    lastDay = null;
    lastStatus = null;
    refreshWidgets();
    await tick();
  }

  /**
   * @description Remember the language of a widget request.
   * @param {string} next - The language.
   */
  function rememberLanguage(next) {
    if (isLanguage(next) && next !== store.language()) {
      store.setLanguage(next);
    }
  }

  const ttl = () => ttlUntil(secondsUntilMidnight(now(), timezone));

  // --- Scene action ---------------------------------------------------------
  gladys.onSceneAction(SCENE_ACTIONS.GET_GARDEN_TASKS, async (fields = {}) => {
    const day = today();
    const tomorrow = addDays(day, 1);
    return gardenTasksOutputs(
      windows(day, tomorrow),
      day,
      fields,
      lunar(day, tomorrow),
      textLanguage(),
    );
  });

  // --- Widgets --------------------------------------------------------------
  gladys.onWidgetGet(WIDGETS.TASKS, async ({ language: lang } = {}) => {
    rememberLanguage(lang);
    const day = today();
    const weekEnd = addDays(day, SOON_DAYS);
    return buildTasksWidget({
      windows: windows(day, weekEnd),
      today: day,
      lunar: lunar(day, weekEnd),
      climate: climate(),
      language: isLanguage(lang) ? lang : textLanguage(),
      ttl: ttl(),
    });
  });

  gladys.onWidgetGet(WIDGETS.CROP, async ({ settings = {}, language: lang } = {}) => {
    rememberLanguage(lang);
    const day = today();
    const crop = settings.crop || DEFAULT_WIDGET_CROP;
    const yearEnd = addDays(day, 366);
    return buildCropWidget({
      crop,
      windows: windows(day, yearEnd, [crop]),
      today: day,
      lunar: config.lunar ? lunar(day, addDays(day, 120)) : null,
      climate: climate(),
      language: isLanguage(lang) ? lang : textLanguage(),
      ttl: ttl(),
    });
  });

  // --- Calendars and configuration ------------------------------------------
  gladys.onCalendarAccountUpdated(async (userSelector) => {
    await calendarSync.syncUser(userSelector);
  });

  gladys.onConfigUpdated(async (raw) => {
    await applyConfig(raw);
  });

  gladys.on('connected', async () => {
    // Calendars may have changed while disconnected: push everything again.
    calendarSync.forget();
    lastStatus = null;
    await applyConfig(gladys.config ?? {});
    logger.info(`connected, timezone ${timezone}`);
    if (tickMs > 0 && timer === null) {
      timer = setInterval(() => tick(), tickMs);
      timer.unref?.();
    }
  });

  const stop = () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };

  gladys.handleShutdown(async (signal) => {
    logger.info(`Received ${signal} -> graceful shutdown`);
    stop();
    await running;
  });

  return { tick, stop };
}

export { TICK_MS, DEFAULT_WIDGET_CROP, createApp };

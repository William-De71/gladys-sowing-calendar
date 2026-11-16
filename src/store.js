// -----------------------------------------------------------------------------
// What the integration keeps in /data/state.json (the only writable place of
// the container):
//   - `day`       the last day scene events were fired, and
//   - `fired`     the keys of the events of that day already published (never
//                 twice, even across a restart; an event Gladys refused is
//                 tried again at the next tick);
//   - `language`  the language of the last widget request.
// Written atomically (temporary file, then rename). A missing or broken file
// starts empty: everything else is computed again.
// -----------------------------------------------------------------------------

import { readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { isLanguage } from './i18n.js';

const DEFAULT_PATH = '/data/state.json';

/**
 * @description The state of the integration.
 * @param {object} [options] - Options.
 * @param {string|null} [options.path] - The file (null: memory only, tests).
 * @param {object} [options.logger] - Logger.
 * @returns {object} The store.
 */
function createStore({ path = DEFAULT_PATH, logger } = {}) {
  let state = { day: null, fired: [], language: null };

  if (path !== null) {
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8'));
      state = {
        day: typeof raw?.day === 'string' ? raw.day : null,
        fired: Array.isArray(raw?.fired) ? raw.fired.filter((key) => typeof key === 'string') : [],
        language: isLanguage(raw?.language) ? raw.language : null,
      };
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger?.warn(`state file ignored: ${error.message}`);
      }
    }
  }

  const save = () => {
    if (path === null) return;
    try {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(`${path}.tmp`, JSON.stringify(state));
      renameSync(`${path}.tmp`, path);
    } catch (error) {
      logger?.warn(`unable to save the state: ${error.message}`);
    }
  };

  return {
    /**
     * @param {string} day - YYYY-MM-DD.
     * @returns {string[]} The keys of the events of that day already fired.
     */
    fired: (day) => (state.day === day ? state.fired : []),
    /**
     * @param {string} day - YYYY-MM-DD.
     * @param {string} key - The key of the event published.
     */
    addFired(day, key) {
      if (state.day !== day) {
        state.day = day;
        state.fired = [];
      }
      state.fired.push(key);
      save();
    },
    /** @returns {string|null} The language of the last widget request. */
    language: () => state.language,
    /** @param {string} language - en, fr, de or es. */
    setLanguage(language) {
      state.language = language;
      save();
    },
  };
}

export { DEFAULT_PATH, createStore };

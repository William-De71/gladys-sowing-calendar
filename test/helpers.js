// Shared helpers of the tests: a silent logger and the lunar days of a span,
// computed once per test file. Tests never touch the network (the integration
// never does).

import { createAlmanac } from '../src/almanac.js';
import { lunarDays } from '../src/lunar.js';

const silent = { info() {}, warn() {}, error() {}, debug() {} };

const almanacs = new Map();

/**
 * @description The lunar days of a span of local days.
 * @param {string} from - First day, YYYY-MM-DD.
 * @param {string} to - Last day included, YYYY-MM-DD.
 * @param {string} [timezone] - IANA timezone.
 * @returns {Map} lunarDays.
 */
function lunarOf(from, to, timezone = 'Europe/Paris') {
  if (!almanacs.has(timezone)) almanacs.set(timezone, createAlmanac({ timezone }));
  const almanac = almanacs.get(timezone);
  return lunarDays((a, b) => almanac.get(a, b), from, to, timezone);
}

export { silent, lunarOf };

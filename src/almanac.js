// -----------------------------------------------------------------------------
// The lunar gardening almanac, computed locally with astronomy-engine (MIT,
// VSOP87 / ELP, positions to a few arcseconds): no network, no key.
//
// The method of the biodynamic calendars (Maria Thun) and of the French
// "calendriers lunaires du jardinier":
//
//   - Day type: the constellation the moon stands in, with the real, unequal
//     boundaries of the 12 zodiac constellations (IAU 1930, Delporte, the
//     table astronomy-engine ships), not 12 signs of 30°. Fire constellations
//     (Aries, Leo, Sagittarius) give fruit days, earth (Taurus, Virgo,
//     Capricorn) root days, air (Gemini, Libra, Aquarius) flower days, water
//     (Cancer, Scorpio, Pisces) leaf days.
//   - The moon also crosses constellations outside the zodiac (Ophiuchus
//     every month, sometimes Auriga, Orion, Cetus, Sextans). Like the
//     calendars, they give no day type of their own: the crossing keeps the
//     constellation before it until the next local midnight, then takes the
//     one after it (a crossing without a midnight is split in its middle).
//   - Ascending / descending moon: the declination of the moon grows or
//     falls (a cycle of 27.3 days, independent of the phase). A day is
//     ascending or descending after its local noon.
//   - Days to avoid: the local day of a perigee, an apogee, a lunar node
//     (the moon crosses the ecliptic), a lunar or a solar eclipse (penumbral
//     lunar eclipses included). The calendars mark the whole day.
//
// Checked against the published 2026 and 2027 calendars of icalendrier.fr,
// day by day (types, trajectory, days to avoid): 730 days out of 730, and to
// the minute on the changes it prints (test/almanac.test.js keeps 2026).
// -----------------------------------------------------------------------------

import * as Astronomy from 'astronomy-engine';
import { addDays } from './dates.js';
import { localDay, localMidnight } from './time.js';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
// The moon moves 0.5° an hour: the smallest corner of a constellation it
// cuts lasts a few hours, a 10-minute sampling sees every crossing.
const SAMPLE_MS = 10 * MINUTE;

const DAY_TYPES = ['fruit', 'root', 'flower', 'leaf'];
const TRAJECTORIES = ['ascending', 'descending'];

// IAU abbreviation -> key of the zodiac constellation (keys are forever).
const ZODIAC = {
  Ari: 'aries',
  Tau: 'taurus',
  Gem: 'gemini',
  Cnc: 'cancer',
  Leo: 'leo',
  Vir: 'virgo',
  Lib: 'libra',
  Sco: 'scorpio',
  Sgr: 'sagittarius',
  Cap: 'capricorn',
  Aqr: 'aquarius',
  Psc: 'pisces',
};
const CONSTELLATIONS = Object.values(ZODIAC);

const DAY_TYPE_OF = {
  aries: 'fruit',
  leo: 'fruit',
  sagittarius: 'fruit',
  taurus: 'root',
  virgo: 'root',
  capricorn: 'root',
  gemini: 'flower',
  libra: 'flower',
  aquarius: 'flower',
  cancer: 'leaf',
  scorpio: 'leaf',
  pisces: 'leaf',
};

const UNFAVOURABLE_KINDS = [
  'perigee',
  'apogee',
  'ascending_node',
  'descending_node',
  'lunar_eclipse',
  'solar_eclipse',
];

/**
 * @description The equatorial coordinates of the moon (J2000, geocentric).
 * @param {number} ms - The instant.
 * @returns {{ ra: number, dec: number }} Right ascension (hours), declination (degrees).
 */
function moonEquator(ms) {
  return Astronomy.EquatorFromVector(Astronomy.GeoMoon(new Date(ms)));
}

/**
 * @description The IAU constellation of the moon.
 * @param {number} ms - The instant.
 * @returns {string} Its abbreviation (`Sgr`, `Oph`…).
 */
function constellationAt(ms) {
  const { ra, dec } = moonEquator(ms);
  return Astronomy.Constellation(ra, dec).symbol;
}

/**
 * @description The instant where `test` turns true (within 30 seconds),
 * between an instant where it is false and one where it is true.
 * @param {number} low - `test(low)` is false.
 * @param {number} high - `test(high)` is true.
 * @param {Function} test - `(ms) => boolean`.
 * @returns {number} An instant where `test` is already true.
 */
function bisect(low, high, test) {
  let a = low;
  let b = high;
  while (b - a > MINUTE / 2) {
    const middle = (a + b) / 2;
    if (test(middle)) b = middle;
    else a = middle;
  }
  return b;
}

/**
 * @description An instant truncated to its minute, like the printed
 * calendars (09:34 for 09:34:40).
 * @param {number} ms - The instant.
 * @returns {number} The minute.
 */
const toMinute = (ms) => Math.floor(ms / MINUTE) * MINUTE;

/**
 * @description The first instant of a fixed grid at or after `ms`: the same
 * span sampled from two starting points gives the same minutes.
 * @param {number} ms - The instant.
 * @param {number} step - The grid step.
 * @returns {number} The instant on the grid.
 */
const onGrid = (ms, step) => Math.ceil(ms / step) * step;

/**
 * @description The constellations the moon crosses, as runs.
 * @param {number} from - Start (ms).
 * @param {number} to - End (ms).
 * @returns {Array<{ start: number, end: number, symbol: string }>} The runs.
 */
function constellationRuns(from, to) {
  const runs = [];
  let start = from;
  let symbol = constellationAt(from);
  for (let at = onGrid(from + 1, SAMPLE_MS); at < to + SAMPLE_MS; at += SAMPLE_MS) {
    const t = Math.min(at, to);
    const next = constellationAt(t);
    let cursor = Math.max(from, t - SAMPLE_MS);
    // Several crossings in one step (a corner of a constellation): walk them.
    while (next !== symbol) {
      const previous = symbol;
      const change = bisect(cursor, t, (ms) => constellationAt(ms) !== previous);
      runs.push({ start, end: toMinute(change), symbol });
      start = toMinute(change);
      symbol = constellationAt(change);
      cursor = change;
    }
    if (t >= to) break;
  }
  runs.push({ start, end: to, symbol });
  return runs;
}

/**
 * @description Attach every crossing outside the zodiac to the constellation
 * before it until the next local midnight, then to the one after it, and
 * merge the runs of a same constellation.
 * @param {Array<object>} runs - The runs of constellationRuns.
 * @param {string} timezone - IANA timezone of the house.
 * @returns {Array<{ start: number, end: number, constellation: string, type: string }>} The day type segments.
 */
function resolveSegments(runs, timezone) {
  const pieces = [];
  runs.forEach((run, index) => {
    const own = ZODIAC[run.symbol];
    if (own) {
      pieces.push({ start: run.start, end: run.end, constellation: own });
      return;
    }
    const before = runs
      .slice(0, index)
      .reverse()
      .find((other) => ZODIAC[other.symbol]);
    const after = runs.slice(index + 1).find((other) => ZODIAC[other.symbol]);
    const previous = ZODIAC[(before ?? after)?.symbol];
    const next = ZODIAC[(after ?? before)?.symbol];
    if (!previous) return;
    const midnight = localMidnight(addDays(localDay(new Date(run.start), timezone), 1), timezone);
    const split =
      midnight > run.start && midnight < run.end
        ? midnight
        : Math.round((run.start + run.end) / 2 / MINUTE) * MINUTE;
    pieces.push({ start: run.start, end: split, constellation: previous });
    pieces.push({ start: split, end: run.end, constellation: next });
  });
  const segments = [];
  for (const piece of pieces) {
    const last = segments[segments.length - 1];
    if (piece.end <= piece.start) continue;
    if (last && last.constellation === piece.constellation) {
      last.end = piece.end;
    } else {
      segments.push({ ...piece, type: DAY_TYPE_OF[piece.constellation] });
    }
  }
  return segments;
}

/**
 * @description The declination of the moon grows at this instant.
 * @param {number} ms - The instant.
 * @param {number} [half] - Half the span compared.
 * @returns {boolean} True when ascending.
 */
function isAscending(ms, half = MINUTE) {
  return moonEquator(ms + half).dec > moonEquator(ms - half).dec;
}

/**
 * @description The ascending and descending periods of the moon.
 * @param {number} from - Start (ms).
 * @param {number} to - End (ms).
 * @returns {Array<{ start: number, end: number, trajectory: string }>} The periods.
 */
function trajectoryPeriods(from, to) {
  const periods = [];
  let start = from;
  let ascending = isAscending(from, 30 * MINUTE);
  for (let at = onGrid(from + 1, HOUR); at <= to; at += HOUR) {
    const now = isAscending(at, 30 * MINUTE);
    if (now !== ascending) {
      const was = ascending;
      const turn = toMinute(
        bisect(Math.max(start, at - HOUR), at, (ms) => isAscending(ms) !== was),
      );
      periods.push({ start, end: turn, trajectory: was ? 'ascending' : 'descending' });
      start = turn;
      ascending = now;
    }
  }
  periods.push({ start, end: to, trajectory: ascending ? 'ascending' : 'descending' });
  return periods;
}

/**
 * @description The lunar configurations the calendars avoid.
 * @param {number} from - Start (ms).
 * @param {number} to - End (ms).
 * @returns {Array<{ kind: string, at: number, detail: string }>} The events, by date.
 */
function unfavourableEvents(from, to) {
  const events = [];
  const inside = (ms) => ms >= from && ms < to;
  const start = new Date(from);

  for (
    let apsis = Astronomy.SearchLunarApsis(start);
    apsis.time.date.getTime() < to;
    apsis = Astronomy.NextLunarApsis(apsis)
  ) {
    const at = apsis.time.date.getTime();
    if (inside(at)) {
      events.push({
        kind: apsis.kind === Astronomy.ApsisKind.Pericenter ? 'perigee' : 'apogee',
        at,
        detail: '',
      });
    }
  }
  for (
    let node = Astronomy.SearchMoonNode(start);
    node.time.date.getTime() < to;
    node = Astronomy.NextMoonNode(node)
  ) {
    const at = node.time.date.getTime();
    if (inside(at)) {
      events.push({
        kind:
          node.kind === Astronomy.NodeEventKind.Ascending ? 'ascending_node' : 'descending_node',
        at,
        detail: '',
      });
    }
  }
  for (
    let eclipse = Astronomy.SearchLunarEclipse(start);
    eclipse.peak.date.getTime() < to;
    eclipse = Astronomy.NextLunarEclipse(eclipse.peak)
  ) {
    const at = eclipse.peak.date.getTime();
    if (inside(at)) events.push({ kind: 'lunar_eclipse', at, detail: String(eclipse.kind) });
  }
  for (
    let eclipse = Astronomy.SearchGlobalSolarEclipse(start);
    eclipse.peak.date.getTime() < to;
    eclipse = Astronomy.NextGlobalSolarEclipse(eclipse.peak)
  ) {
    const at = eclipse.peak.date.getTime();
    if (inside(at)) events.push({ kind: 'solar_eclipse', at, detail: String(eclipse.kind) });
  }
  return events.sort((a, b) => a.at - b.at);
}

/**
 * @description The phase of the moon.
 * @param {number} ms - The instant.
 * @returns {{ waxing: boolean, illumination: number }} Waxing or waning, lit percent.
 */
function moonPhase(ms) {
  const date = new Date(ms);
  const angle = Astronomy.MoonPhase(date);
  const illumination = Math.round(
    Astronomy.Illumination(Astronomy.Body.Moon, date).phase_fraction * 100,
  );
  return { waxing: angle < 180, illumination };
}

/**
 * @description The new and full moons and the quarters.
 * @param {number} from - Start (ms).
 * @param {number} to - End (ms).
 * @returns {Array<{ quarter: number, at: number }>} 0 new, 1 first quarter, 2 full, 3 last quarter.
 */
function moonQuarters(from, to) {
  const quarters = [];
  for (
    let quarter = Astronomy.SearchMoonQuarter(new Date(from));
    quarter.time.date.getTime() < to;
    quarter = Astronomy.NextMoonQuarter(quarter)
  ) {
    quarters.push({ quarter: quarter.quarter, at: quarter.time.date.getTime() });
  }
  return quarters;
}

/**
 * @description Compute the almanac of a span: day type segments, trajectory
 * periods, days to avoid, quarters. About half a second for a year.
 * @param {number} from - Start (ms).
 * @param {number} to - End (ms).
 * @param {string} timezone - IANA timezone of the house (midnights).
 * @returns {object} `{ from, to, segments, trajectories, unfavourable, quarters }`.
 */
function computeAlmanac(from, to, timezone) {
  // Two days of margin on each side: a crossing outside the zodiac at an
  // edge needs the constellations around it.
  const margin = 2 * DAY;
  const segments = resolveSegments(constellationRuns(from - margin, to + margin), timezone);
  return {
    from,
    to,
    segments: segments.filter((segment) => segment.end > from && segment.start < to),
    trajectories: trajectoryPeriods(from - margin, to + margin).filter(
      (period) => period.end > from && period.start < to,
    ),
    unfavourable: unfavourableEvents(from, to),
    quarters: moonQuarters(from, to),
  };
}

/**
 * @description An almanac kept in memory, computed again when a span leaves it.
 * @param {object} options - Options.
 * @param {string} options.timezone - IANA timezone of the house.
 * @param {number} [options.backDays] - Days kept before the span asked.
 * @param {number} [options.aheadDays] - Days computed after the span asked.
 * @returns {{ get: Function }} `get(from, to)` -> the almanac covering it.
 */
function createAlmanac({ timezone, backDays = 40, aheadDays = 400 }) {
  let cache = null;
  return {
    get(from, to) {
      if (!cache || from < cache.from || to > cache.to) {
        cache = computeAlmanac(from - backDays * DAY, from + aheadDays * DAY, timezone);
      }
      return cache;
    },
  };
}

/**
 * @description What the calendar says of one local day.
 * @param {object} almanac - An almanac covering the day.
 * @param {string} day - YYYY-MM-DD.
 * @param {string} timezone - IANA timezone of the house.
 * @returns {object} The day: its segments, main type, trajectory, days to avoid, phase.
 */
function describeDay(almanac, day, timezone) {
  const start = localMidnight(day, timezone);
  const end = localMidnight(addDays(day, 1), timezone);
  const segments = almanac.segments
    .filter((segment) => segment.end > start && segment.start < end)
    .map((segment) => ({
      ...segment,
      from: Math.max(segment.start, start),
      until: Math.min(segment.end, end),
    }));
  const covered = {};
  segments.forEach((segment) => {
    covered[segment.type] = (covered[segment.type] ?? 0) + segment.until - segment.from;
  });
  const main = segments.reduce(
    (best, segment) => (covered[segment.type] > (covered[best?.type] ?? -1) ? segment : best),
    null,
  );
  const noon = start + (end - start) / 2;
  const period = almanac.trajectories.find((entry) => entry.start <= noon && entry.end > noon);
  const turn = almanac.trajectories.find(
    (entry) => entry.start > start && entry.start < end && entry.start > almanac.from,
  );
  return {
    day,
    start,
    end,
    segments,
    types: [...new Set(segments.map((segment) => segment.type))],
    type: main?.type ?? null,
    constellation: main?.constellation ?? null,
    trajectory: period?.trajectory ?? null,
    trajectoryTurn: turn ? { at: turn.start, trajectory: turn.trajectory } : null,
    unfavourable: almanac.unfavourable.filter((event) => event.at >= start && event.at < end),
    quarter: almanac.quarters.find((entry) => entry.at >= start && entry.at < end) ?? null,
    phase: moonPhase(noon),
  };
}

/**
 * @description The day type segment in force at an instant.
 * @param {object} almanac - An almanac covering the instant.
 * @param {number} ms - The instant.
 * @returns {object|null} The segment.
 */
const segmentAt = (almanac, ms) =>
  almanac.segments.find((segment) => segment.start <= ms && segment.end > ms) ?? null;

/**
 * @description The trajectory period in force at an instant.
 * @param {object} almanac - An almanac covering the instant.
 * @param {number} ms - The instant.
 * @returns {object|null} The period.
 */
const trajectoryAt = (almanac, ms) =>
  almanac.trajectories.find((period) => period.start <= ms && period.end > ms) ?? null;

export {
  DAY,
  DAY_TYPES,
  TRAJECTORIES,
  CONSTELLATIONS,
  DAY_TYPE_OF,
  UNFAVOURABLE_KINDS,
  constellationAt,
  constellationRuns,
  resolveSegments,
  trajectoryPeriods,
  unfavourableEvents,
  moonPhase,
  moonQuarters,
  computeAlmanac,
  createAlmanac,
  describeDay,
  segmentAt,
  trajectoryAt,
};

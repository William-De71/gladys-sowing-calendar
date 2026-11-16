// Builds the widget contents of the illustrations with the integration's own
// code: node gen.mjs <repo> <out.json> (run by render.sh)
//
// Both widgets on a fixed day (Friday 9 April 2027, in Paris), with the
// default crops of the configuration, the temperate zone and the lunar
// option: the windows come from src/plan.js, the lunar days from
// src/almanac.js. Nothing is made up.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const [repo, out] = process.argv.slice(2);
const load = (path) => import(pathToFileURL(`${repo}/${path}`).href);
const { buildTasksWidget, buildCropWidget, SOON_DAYS } = await load('src/widgets.js');
const { windowsBetween, climateOf } = await load('src/plan.js');
const { DEFAULT_CROPS } = await load('src/crops.js');
const { createAlmanac } = await load('src/almanac.js');
const { lunarDays } = await load('src/lunar.js');
const { addDays } = await load('src/dates.js');
const { LANGUAGES } = await load('src/i18n.js');
const manifest = JSON.parse(readFileSync(`${repo}/gladys-assistant-integration.json`, 'utf8'));

const TZ = 'Europe/Paris';
const TODAY = '2027-04-09';
const NOW = Date.parse('2027-04-09T06:00:00Z');
const climate = climateOf({});
const almanac = createAlmanac({ timezone: TZ });
const lunar = lunarDays((a, b) => almanac.get(a, b), TODAY, addDays(TODAY, 120), TZ);
const contents = {};
for (const language of LANGUAGES) {
  contents[language] = {
    tasks: buildTasksWidget({
      windows: windowsBetween(DEFAULT_CROPS, climate, TODAY, addDays(TODAY, SOON_DAYS)),
      today: TODAY,
      lunar,
      climate,
      language,
      ttl: 3600,
    }),
    crop: buildCropWidget({
      crop: 'tomato',
      windows: windowsBetween(['tomato'], climate, TODAY, addDays(TODAY, 366)),
      today: TODAY,
      lunar,
      climate,
      language,
      ttl: 3600,
    }),
  };
}
const widgets = Object.fromEntries(
  manifest.widgets.map((w) => [w.key, { icon: w.icon, label: w.label }]),
);
writeFileSync(out, JSON.stringify({ now: NOW, widgets, contents }));

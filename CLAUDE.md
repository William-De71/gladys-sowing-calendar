# CLAUDE.md

Project rules for coding assistants (Claude Code reads this file) and for human
contributors.

## What this is

A Gladys Assistant **external integration** for a kitchen-garden sowing
calendar: a Node.js service (Node 22+, ESM, no build step) that runs in its
own sandboxed Docker container and talks to Gladys through
[`@gladysassistant/integration-sdk`](https://github.com/GladysAssistant/integration-sdk-js).
The lunar option uses [`astronomy-engine`](https://github.com/cosinekitty/astronomy)
(MIT) for the position of the moon and the IAU constellation boundaries.

A **calendar integration** (`type: "calendar"`, Gladys 5.3.0+): one "Sowing
calendar" for every user who enabled it in "My calendars", three scene
triggers, one scene action and two dashboard widgets. No devices: Gladys does
not let one manifest be both. Everything is computed locally: no network, no
key, no account. Transport: `["local"]`.

## Commands

```bash
npm install
npm test                                  # node --test, never touches the network
node --test test/plan.test.js             # one file
DEBUG=gladys-integration-sdk npm test     # with the SDK debug logs
npm run lint                              # ESLint
npm run format:check                      # Prettier, as the CI runs it
npm run format                            # Prettier, fix in place
npx github:GladysAssistant/integration-store . --skip-image-check   # store checks
node scripts/sync-crops.mjs               # the crop lists of the manifest from src/crops.js
scripts/build-cover.sh                    # cover.jpg from docs/assets/cover.svg
docs/illustrations/render.sh              # docs/assets/widgets.<lang>.png
node .github/scripts/release.mjs next     # the version the next release would get
```

## Architecture

```
index.js                SDK wiring only (new GladysIntegration + createApp)
src/app.js              every handler, registered before connect(); the clock (tick)
src/crops.js            the table: 55 crops, their lunar type, names, task windows
                        by half-month for the reference (temperate) climate
src/plan.js             the windows as dates: climate zone, fine adjustment, hemisphere
src/garden.js           the garden of a day and its words: summaries, scene values
src/lunar.js            the lunar option: lunar days, favourable runs of a window
src/almanac.js          the lunar computation (astronomy-engine), cached in memory;
                        the same file as gladys-lunar-gardening-calendar
src/calendar.js         one calendar per user, one all-day event per window
src/events.js           scene events of a day and scene action outputs
src/widgets.js          the `tasks` and `crop` widgets (pure, reused by docs/illustrations/gen.mjs)
src/store.js            /data/state.json: scene events fired today, language
src/config.js           configuration (crops, zone, offset, hemisphere, tasks, moon, hour, language)
src/i18n.js             runtime texts, en / fr / de / es
src/dates.js            YYYY-MM-DD arithmetic, pure
src/time.js             timezone helpers (TZ given by the supervisor), local midnights
scripts/sync-crops.mjs  copies the crops into the four crop lists of the manifest
gladys-assistant-integration.json   manifest
docs/{en,fr,de,es}.md   user documentation, re-hosted by the store
docs/illustrations/     generated widget images (render.sh, gen.mjs, render.js)
test/fixtures/icalendrier-2026.json the 365 days of a published lunar calendar
.github/scripts/release.mjs         version, changelog, bump (tested in test/)
```

## Rules

- **Keys are forever**: the crop keys of `src/crops.js` (stored in the
  configuration, the scenes, the widget settings and the event ids), the
  calendar id `ext:<selector>:<user>:sowing`, the event ids
  `…:<crop>-<task>-<year>-<range>` (the year of the reference start and the
  position of the range in the task: never a date, so a new climate moves an
  event instead of duplicating it), the task values `sow_indoors` /
  `sow_outdoors` / `plant_out` / `harvest`, the zone values, `fruit` / `root`
  / `flower` / `leaf`, `yes` / `no`, the keys of `config_schema`, of the
  widgets and their setting, of the scene triggers (fields, variables) and of
  the scene action (field, options, outputs). `test/manifest.test.js` lists
  them on purpose. Changing the order of the ranges of a task changes event
  ids: add a new range at the end.
- **The table.** Dates by half-month (`MMa` = 1st-15th, `MMb` = 16th-end) for
  the reference climate (northern half of France, Belgium, Swiss plateau,
  southern Germany), written for this project from the usual French
  kitchen-garden calendars: never copy a published table. After adding or
  renaming a crop, run `node scripts/sync-crops.mjs` (the four crop lists of
  the manifest; `test/manifest.test.js` checks them).
- **The climate.** A reference date up to July 15 takes the spring shift of
  the zone, a later one the autumn shift; then the fine adjustment (weeks) on
  every date; the southern hemisphere adds six months. A window keeps at least
  7 days.
- **The lunar option** is off by default and the almanac is computed only when
  it is on. A day suits a crop when its main day type (the longest of the
  local day) is the type of the crop and it is not a day to avoid.
  `src/almanac.js` is shared with gladys-lunar-gardening-calendar: change it
  there first (its tests keep 730/730 days against icalendrier.fr).
- **Days are calendar days in the timezone of Gladys** (`TZ`): never compute a
  day from UTC.
- **Calendar.** Events from 7 days back to 366 ahead, in the language of each
  user (`account.user.language`); pushed at connection, when an account or the
  configuration changes, and at midnight. The push window starts 30 days back:
  the core prunes only inside the window. At most 30 writes a minute (spaced
  by 2.1 s); a calendar with `sync: false` is skipped. Every crop and task
  makes about 190 windows a year (limit 500 per request). It starts private:
  the user shares it.
- **Scene events.** Once a day at the event hour: the daily summary, then one
  event per window opening that day and per window entering its last week
  (windows of two weeks or more). Each event published is remembered in /data
  for the day; a refused one is tried again at the next tick. A scene action
  or a widget never fires a scene event.
- **The manifest stays under 100 KB** (the store indexer refuses a bigger one
  silently): multi-language texts on one line, `test/manifest.test.js` keeps a
  margin.
- **The container rootfs is read-only.** Write only under `/data`.
- **Four languages.** Every user-facing text (manifest, `src/i18n.js`, the
  crop names, `docs/*.md`, README) exists in English, French, German and
  Spanish (`test/i18n.test.js`). Use the words of the Gladys UI (Mes
  calendriers / My calendars / Meine Kalender / Mis calendarios, Activer pour
  moi…) and of the seed packets.
- **Widget images.** After any change to the content of a widget, run
  `docs/illustrations/render.sh` again and look at the four PNG files.
- **Versions belong to the Release workflow**: never edit `version` in
  `package.json`, the lockfile or the manifest, nor the `docker_image` tag.
  The version stays below 1.0.0 until the maintainer runs the Release workflow
  with `release-as: 1.0.0`.
- **Changelog.** Never edit CHANGELOG.md by hand, it is generated at the
  release. Write the PR title as the line the user will read.
- **Commits and PR titles** follow Conventional Commits, in English: `feat` ->
  minor, `fix` / `perf` -> patch, `!` or `BREAKING CHANGE:` -> major (minor
  below 1.0.0); `docs`, `chore`, `ci`, `test`, `style`, `refactor`, `build`
  release nothing.
- **Manifest.** Texts are objects `{ "en", "fr", "de", "es" }`; the catalog
  `description` holds 10 to 100 characters per language. No permission, no
  `countries` (climate zones and hemispheres cover the world).
- **Forum drafts** (`.github/forum-*.md`) are never committed.
- **Style.** Prettier formats, ESLint catches mistakes. Comments explain why,
  in English. Tests never touch the network.

## Pitfalls

- A widget card holds 2 texts at most (1 body): with the lunar heading and the
  "nothing to do" body, the climate caption gives way.
- A card-list subtitle holds 60 characters, a status value 40: crop lists are
  cut, the full list is in the description of the card (shown on tap).
- Intl writes English date ranges with thin spaces ("Apr 1 – 2"): compare
  after replacing ` ` in the tests.
- A sentence ending on an abbreviated date ("15 avr.") must not get a second
  full stop: `t()` collapses it.
- The trigger filters compare with `===`: `day_type` of the daily summary is
  the longest lunar type of the day, empty without the option.

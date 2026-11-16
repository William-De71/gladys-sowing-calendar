// -----------------------------------------------------------------------------
// Entry point of the Sowing calendar external integration.
//
// Brings a sowing calendar for the kitchen garden into Gladys, computed
// locally for the climate of the house:
//   - calendar: when to sow under cover, sow outdoors, plant out and harvest
//     each crop of the garden, for every user who enabled the integration in
//     "My calendars" (src/calendar.js);
//   - scene triggers: a daily summary, a window that opens, a window in its
//     last week;
//   - scene action: the garden tasks of today or tomorrow;
//   - dashboard widgets: the tasks of the day, one crop;
//   - option: the favourable days of the lunar gardening calendar.
//
// This file only wires the SDK client: the handlers are in src/app.js.
//
// Environment variables provided by the Gladys supervisor:
//   GLADYS_HOST_API_URL / GLADYS_INTEGRATION_TOKEN / GLADYS_INTEGRATION_SELECTOR
//   TZ (the timezone of Gladys: a day starts at its midnight)
// The SDK reads the first three: `new GladysIntegration()` is enough.
// -----------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { GladysIntegration, logger } from '@gladysassistant/integration-sdk';
import { createApp } from './src/app.js';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const gladys = new GladysIntegration();
createApp(gladys);

// --- Startup -----------------------------------------------------------------------
logger.info(`Starting the Sowing calendar integration ${version}...`);
gladys.connect().catch((err) => {
  logger.error('Initial connection failed', err);
  process.exit(1);
});

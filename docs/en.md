# Sowing calendar

## Overview

A sowing calendar for your kitchen garden in Gladys: when to sow under cover, sow outdoors, plant out and harvest each crop, with dates adjusted to your climate. Everything is computed in the integration itself: no account, no key, no connection.

- **55 crops**: 43 vegetables (tomato, carrot, leek, cabbage, strawberry…) and 12 herbs (basil, parsley, chives, thyme…). You tick those of your garden.
- **Dates for your climate**: a climate zone (Mediterranean, mild oceanic, temperate, continental, mountain), a fine adjustment in weeks and the southern hemisphere.
- **Optionally, the moon**: the days of the lunar gardening calendar (Maria Thun method) that suit each crop, root days for carrots, fruit days for tomatoes…

You get a calendar in **My calendars**, two dashboard widgets, three scene triggers and one scene action.

![The In the garden and Crop widgets on Friday, April 9, 2027, with the lunar option (generated illustration, not a screenshot)](https://raw.githubusercontent.com/William-De71/gladys-sowing-calendar/main/docs/assets/widgets.en.png)

## Prerequisites

- Gladys Assistant 5.3.0 or later.
- The right timezone in Gladys (Settings → System): days change at midnight in this timezone.

## Configuration

1. Install the integration from **Integrations** (Sowing calendar).
2. Tick the crops of your garden and choose your climate zone.
3. Under **My calendars**, click **Enable for me**: the “Sowing calendar” appears among your calendars. To use it in scenes, open it in **Calendars** and share it with the household.

| Field                      | Default         | Effect                                                                                                |
| -------------------------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| Crops of the garden        | 16 common crops | The calendar, the widgets and the scenes follow these crops.                                          |
| Climate zone               | Temperate       | Moves the reference dates (see below).                                                                |
| Fine adjustment (weeks)    | 0               | Weeks added to every date, −4 to 4: positive for a frost pocket, negative for a sheltered garden.     |
| Hemisphere                 | Northern        | Southern: every date six months later.                                                                |
| Tasks in the calendar      | all four        | Sow under cover, sow outdoors, plant out, harvest. The widgets and the scenes always show everything. |
| Favourable lunar days      | no              | Adds the days of the moon that suit each crop (computed locally, about a second per year).            |
| Hour of the scene triggers | 7               | The triggers start every day at this hour (0 to 23).                                                  |
| Language of the texts      | Automatic       | Scene texts and status. The calendar always follows the language of each user.                        |

The reference dates are those of a temperate climate: northern half of France, Belgium, Swiss plateau, southern Germany. A warmer zone starts the spring earlier and ends the autumn later, a colder one the reverse: a date up to July 15 follows the spring shift, a later one the autumn shift.

| Zone          | Spring          | Autumn          |
| ------------- | --------------- | --------------- |
| Mediterranean | 3 weeks earlier | 3 weeks later   |
| Mild oceanic  | 1 week earlier  | 2 weeks later   |
| Temperate     | reference dates | reference dates |
| Continental   | 1 week later    | 1 week earlier  |
| Mountain      | 3 weeks later   | 3 weeks earlier |

## Usage

### Calendar

- “Sow under cover: Tomato” from February 16 to April 15: one all-day event per crop and task, over its whole window, with the dates, the zone, the advice of the task and, with the lunar option, the favourable days of the window in its description.
- With every crop and every task, about 190 windows a year: untick some tasks (the harvest, for instance) for a lighter calendar.

The calendar covers the past week and the year ahead. It moves forward every night. A new zone moves the events, it never duplicates them.

### Widgets

- **In the garden**: one card per task in progress (the crops; tap the card for until when), what starts within the week and what enters its last week. With the lunar option, the day type as the title and the crops it favours.
- **Crop** (setting “Crop”): each task of one crop with its dates, in green while in progress, and with the lunar option its next favourable days.

### Scenes

Triggers, every day at the hour of the configuration:

- **Daily summary**: what to do in the garden. Filters: a window starts or not, the lunar day type. Variables: the same values as the action below, except `has_opening`.
- **A window starts**: the first day of the window of a crop and a task. Filters: the tasks, the crops. Variables: `crop`, `crop_label`, `task` (sow_indoors, sow_outdoors, plant_out, harvest), `task_label`, `start`, `end`, `end_label`, `lunar_days`, `summary`.
- **Last week of a window**: seven days before the end of a window of two weeks or more. Same filters and variables.

Action **Get the garden tasks** (today or tomorrow): `date`, `sow_indoors`, `sow_outdoors`, `plant_out`, `harvest` (the crops of each task), `task_count`, `opening`, `has_opening` (yes, no), `closing`, `day_type` (fruit, root, flower, leaf), `day_type_label`, `avoid` (yes, no), `favourable`, `summary`.

Examples:

- “A window starts”, filter task = sow under cover → send “{{triggerEvent.data.summary}}”: “Sow under cover, Tomato: from today until Apr 15.”
- “Last week of a window”, filter crop = garlic → reminder “Last week to plant the garlic”.
- Every Sunday at 9:00 (scheduled scene) → “Get the garden tasks” → send its “Summary” output in a message.

### Transport

Local only: everything is computed in the container, nothing leaves your network. The catalog shows the “local” badge.

## How it is computed

- The table of the crops gives, by half-month, the usual windows of French kitchen-garden calendars for a temperate climate. They are guidelines: the weather of the year, the variety and the exposure matter as much.
- Each date is moved by the zone (spring or autumn), then by the fine adjustment; the southern hemisphere adds six months. A window keeps at least a week.
- The lunar option uses the computation of the “Lunar gardening calendar” integration: the type of a day is the longest type of the day (constellation of the moon), days to avoid excluded (perigee, apogee, lunar node, eclipse). Checked day by day against the 2026 calendar published by icalendrier.fr.

## Troubleshooting

- **No calendar**: click **Enable for me** under **My calendars** on the page of the integration. A calendar that is not shared does not appear in scenes: share it with the household.
- **The dates do not fit your garden**: change the zone or use the fine adjustment, which applies to every date. One crop looks wrong: open an issue with the crop, the task and the dates you expect.
- **The daily summary does not start**: it starts once a day, at the configured hour or at the first minute after. It does not start again after a restart on the same day.
- Logs: the **Logs** tab of the integration. In developer mode, `DEBUG=gladys-integration-sdk` adds the logs of the SDK.

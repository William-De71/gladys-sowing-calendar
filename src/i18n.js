// -----------------------------------------------------------------------------
// Texts of the integration, in English, French, German and Spanish (English
// fallback).
//
// The manifest carries its own labels; these are the texts the code writes at
// runtime: calendar and event names, widget contents, scene summaries, status
// of the Configuration screen. The crop names are in src/crops.js. Vocabulary
// of the Gladys interface (Mes calendriers / My calendars / Meine Kalender /
// Mis calendarios) and of the seed packets (semis sous abri, Aussaat unter
// Glas, siembra en semillero…).
// -----------------------------------------------------------------------------

const LANGUAGES = ['en', 'fr', 'de', 'es'];

const TEXTS = {
  // tasks
  task_sow_indoors: {
    en: 'Sow under cover',
    fr: 'Semis sous abri',
    de: 'Aussaat unter Glas',
    es: 'Siembra en semillero',
  },
  task_sow_outdoors: {
    en: 'Sow outdoors',
    fr: 'Semis en pleine terre',
    de: 'Aussaat ins Freiland',
    es: 'Siembra directa',
  },
  task_plant_out: { en: 'Plant out', fr: 'Plantation', de: 'Auspflanzen', es: 'Plantación' },
  task_harvest: { en: 'Harvest', fr: 'Récolte', de: 'Ernte', es: 'Cosecha' },
  advice_sow_indoors: {
    en: 'Sow in trays or pots, in the warmth and the light (greenhouse, frame, bright windowsill), to plant out later.',
    fr: 'Semez en godets ou en terrine, au chaud et à la lumière (serre, châssis, rebord de fenêtre lumineux), pour planter plus tard.',
    de: 'In Schalen oder Töpfen säen, warm und hell (Gewächshaus, Frühbeet, helle Fensterbank), um später auszupflanzen.',
    es: 'Siembre en bandejas o macetas, con calor y luz (invernadero, cajonera, ventana luminosa), para trasplantar más tarde.',
  },
  advice_sow_outdoors: {
    en: 'Sow in place in a fine, moist soil, or in a nursery bed; thin out once the seedlings are up.',
    fr: 'Semez en place dans une terre fine et fraîche, ou en pépinière ; éclaircissez à la levée.',
    de: 'Direkt an Ort und Stelle in feine, feuchte Erde oder ins Anzuchtbeet säen; nach dem Aufgehen vereinzeln.',
    es: 'Siembre en su sitio en tierra fina y húmeda, o en semillero exterior; aclare cuando nazcan.',
  },
  advice_plant_out: {
    en: 'Plant out the seedlings, sets, tubers or crowns; water well. Frost-tender crops only after the last frosts.',
    fr: 'Plantez les plants, bulbes, tubercules ou griffes ; arrosez bien. Les cultures frileuses seulement après les dernières gelées.',
    de: 'Jungpflanzen, Steckzwiebeln, Knollen oder Wurzelstöcke auspflanzen und gut angießen. Frostempfindliches erst nach den letzten Frösten.',
    es: 'Plante los plantones, bulbos, tubérculos o garras; riegue bien. Los cultivos sensibles al frío, solo tras las últimas heladas.',
  },
  advice_harvest: {
    en: 'Harvest as the crop ripens, preferably in the morning, and store what keeps.',
    fr: 'Récoltez au fur et à mesure de la maturité, de préférence le matin, et conservez ce qui se garde.',
    de: 'Nach und nach bei Reife ernten, am besten morgens, und Lagerfähiges einlagern.',
    es: 'Coseche a medida que madura, mejor por la mañana, y conserve lo que se guarda.',
  },

  // climate zones
  zone_mediterranean: {
    en: 'Mediterranean zone',
    fr: 'Zone méditerranéenne',
    de: 'Mittelmeerklima',
    es: 'Zona mediterránea',
  },
  zone_oceanic: {
    en: 'Mild oceanic zone',
    fr: 'Zone océanique douce',
    de: 'Mildes Seeklima',
    es: 'Zona oceánica templada',
  },
  zone_temperate: {
    en: 'Temperate zone',
    fr: 'Zone tempérée',
    de: 'Gemäßigtes Klima',
    es: 'Zona templada',
  },
  zone_continental: {
    en: 'Continental zone',
    fr: 'Zone continentale',
    de: 'Kontinentalklima',
    es: 'Zona continental',
  },
  zone_mountain: {
    en: 'Mountain zone',
    fr: 'Zone de montagne',
    de: 'Bergklima',
    es: 'Zona de montaña',
  },
  offsetWeeks: {
    en: '{sign}{weeks} wk',
    fr: '{sign}{weeks} sem.',
    de: '{sign}{weeks} Wo.',
    es: '{sign}{weeks} sem.',
  },
  southern: {
    en: 'southern hemisphere',
    fr: 'hémisphère sud',
    de: 'Südhalbkugel',
    es: 'hemisferio sur',
  },

  // lunar days
  type_fruit: { en: 'Fruit day', fr: 'Jour fruits', de: 'Fruchttag', es: 'Día de fruto' },
  type_root: { en: 'Root day', fr: 'Jour racines', de: 'Wurzeltag', es: 'Día de raíz' },
  type_flower: { en: 'Flower day', fr: 'Jour fleurs', de: 'Blütentag', es: 'Día de flor' },
  type_leaf: { en: 'Leaf day', fr: 'Jour feuilles', de: 'Blatttag', es: 'Día de hoja' },
  days_fruit: { en: 'Fruit days', fr: 'Jours fruits', de: 'Fruchttage', es: 'Días de fruto' },
  days_root: { en: 'Root days', fr: 'Jours racines', de: 'Wurzeltage', es: 'Días de raíz' },
  days_flower: { en: 'Flower days', fr: 'Jours fleurs', de: 'Blütentage', es: 'Días de flor' },
  days_leaf: { en: 'Leaf days', fr: 'Jours feuilles', de: 'Blatttage', es: 'Días de hoja' },
  dayToAvoid: {
    en: 'Day to avoid',
    fr: 'Jour à éviter',
    de: 'Ungünstiger Tag',
    es: 'Día desfavorable',
  },
  favourableDays: {
    en: 'Favourable {days}: {list}.',
    fr: '{days} favorables : {list}.',
    de: 'Günstige {days}: {list}.',
    es: '{days} favorables: {list}.',
  },
  noFavourableDays: {
    en: 'No favourable {days} left in this window.',
    fr: 'Plus de {days} favorables dans cette période.',
    de: 'Keine günstigen {days} mehr in diesem Zeitraum.',
    es: 'No quedan {days} favorables en este periodo.',
  },

  // calendar
  calendarName: {
    en: 'Sowing calendar',
    fr: 'Calendrier des semis',
    de: 'Aussaatkalender',
    es: 'Calendario de siembra',
  },
  calendarDescription: {
    en: 'When to sow, plant out and harvest the crops of the garden, for its climate (computed locally).',
    fr: 'Quand semer, planter et récolter les cultures du potager, selon son climat (calculé localement).',
    de: 'Wann die Kulturen des Gartens gesät, ausgepflanzt und geerntet werden, je nach Klima (lokal berechnet).',
    es: 'Cuándo sembrar, plantar y cosechar los cultivos del huerto, según su clima (calculado localmente).',
  },
  eventName: {
    en: '{task}: {crop}',
    fr: '{task} : {crop}',
    de: '{task}: {crop}',
    es: '{task}: {crop}',
  },
  eventWhen: {
    en: '{crop}, {task}: {from} to {to} ({climate}).',
    fr: '{crop}, {task} : du {from} au {to} ({climate}).',
    de: '{crop}, {task}: {from} bis {to} ({climate}).',
    es: '{crop}, {task}: del {from} al {to} ({climate}).',
  },

  // scene texts
  opened: {
    en: '{task}, {crop}: from today until {end}.',
    fr: '{task}, {crop} : à partir d’aujourd’hui, jusqu’au {end}.',
    de: '{task}, {crop}: ab heute bis {end}.',
    es: '{task}, {crop}: desde hoy hasta el {end}.',
  },
  closing: {
    en: '{task}, {crop}: last week, until {end}.',
    fr: '{task}, {crop} : dernière semaine, jusqu’au {end}.',
    de: '{task}, {crop}: letzte Woche, bis {end}.',
    es: '{task}, {crop}: última semana, hasta el {end}.',
  },
  summaryTask: {
    en: '{task}: {crops}.',
    fr: '{task} : {crops}.',
    de: '{task}: {crops}.',
    es: '{task}: {crops}.',
  },
  summaryNone_today: {
    en: 'Nothing to sow, plant or harvest today.',
    fr: 'Rien à semer, planter ni récolter aujourd’hui.',
    de: 'Heute gibt es nichts zu säen, pflanzen oder ernten.',
    es: 'Nada que sembrar, plantar ni cosechar hoy.',
  },
  summaryNone_tomorrow: {
    en: 'Nothing to sow, plant or harvest tomorrow.',
    fr: 'Rien à semer, planter ni récolter demain.',
    de: 'Morgen gibt es nichts zu säen, pflanzen oder ernten.',
    es: 'Nada que sembrar, plantar ni cosechar mañana.',
  },
  summaryOpening_today: {
    en: 'Starting today: {list}.',
    fr: 'À partir d’aujourd’hui : {list}.',
    de: 'Ab heute: {list}.',
    es: 'A partir de hoy: {list}.',
  },
  summaryOpening_tomorrow: {
    en: 'Starting tomorrow: {list}.',
    fr: 'À partir de demain : {list}.',
    de: 'Ab morgen: {list}.',
    es: 'A partir de mañana: {list}.',
  },
  summaryClosing: {
    en: 'Last week: {list}.',
    fr: 'Dernière semaine : {list}.',
    de: 'Letzte Woche: {list}.',
    es: 'Última semana: {list}.',
  },
  summaryLunar: {
    en: '{type}: good for {crops}.',
    fr: '{type} : favorable pour {crops}.',
    de: '{type}: günstig für {crops}.',
    es: '{type}: favorable para {crops}.',
  },
  summaryLunarNone: {
    en: '{type}: none of the open tasks.',
    fr: '{type} : aucune des tâches en cours.',
    de: '{type}: keine der laufenden Arbeiten.',
    es: '{type}: ninguna de las tareas en curso.',
  },
  summaryAvoid: {
    en: 'Day to avoid by the moon: neither sow nor plant.',
    fr: 'Jour à éviter selon la lune : ni semis ni plantation.',
    de: 'Ungünstiger Tag nach dem Mond: weder säen noch pflanzen.',
    es: 'Día desfavorable según la luna: ni sembrar ni plantar.',
  },
  taskCrop: {
    en: '{crop} ({task})',
    fr: '{crop} ({task})',
    de: '{crop} ({task})',
    es: '{crop} ({task})',
  },
  todayWord: { en: 'Today', fr: 'Aujourd’hui', de: 'Heute', es: 'Hoy' },
  tomorrowWord: { en: 'Tomorrow', fr: 'Demain', de: 'Morgen', es: 'Mañana' },

  // widgets
  until: { en: 'until {date}', fr: 'jusqu’au {date}', de: 'bis {date}', es: 'hasta el {date}' },
  fromDate: { en: 'from {date}', fr: 'dès le {date}', de: 'ab {date}', es: 'desde el {date}' },
  span: { en: '{from} → {to}', fr: '{from} → {to}', de: '{from} → {to}', es: '{from} → {to}' },
  more: { en: '+{count}', fr: '+{count}', de: '+{count}', es: '+{count}' },
  widgetSoon: {
    en: 'Starting this week',
    fr: 'Commence cette semaine',
    de: 'Beginnt diese Woche',
    es: 'Empieza esta semana',
  },
  widgetClosing: {
    en: 'Last week',
    fr: 'Dernière semaine',
    de: 'Letzte Woche',
    es: 'Última semana',
  },
  widgetNothing: {
    en: 'Nothing to sow, plant or harvest this week for the crops of the configuration.',
    fr: 'Rien à semer, planter ni récolter cette semaine pour les cultures de la configuration.',
    de: 'Diese Woche gibt es für die Kulturen der Konfiguration nichts zu säen, pflanzen oder ernten.',
    es: 'Nada que sembrar, plantar ni cosechar esta semana para los cultivos de la configuración.',
  },
  widgetNoCrop: {
    en: 'Choose a crop in the settings of the widget.',
    fr: 'Choisissez une culture dans les réglages du widget.',
    de: 'Wählen Sie in den Einstellungen des Widgets eine Kultur.',
    es: 'Elija un cultivo en los ajustes del widget.',
  },
  widgetNow: { en: 'Now', fr: 'En cours', de: 'Jetzt', es: 'Ahora' },
  widgetDone: { en: 'Done', fr: 'Passé', de: 'Vorbei', es: 'Pasado' },
  widgetNext: { en: 'Next', fr: 'À venir', de: 'Demnächst', es: 'Próximo' },
  widgetNoLunar: {
    en: 'none left',
    fr: 'plus aucun',
    de: 'keine mehr',
    es: 'ninguno',
  },

  // status of the Configuration screen
  statusRunning: {
    en: '{crops} crops, {climate}. Today: {tasks}.',
    fr: '{crops} cultures, {climate}. Aujourd’hui : {tasks}.',
    de: '{crops} Kulturen, {climate}. Heute: {tasks}.',
    es: '{crops} cultivos, {climate}. Hoy: {tasks}.',
  },
  statusTasks: {
    en: '{count} open windows',
    fr: '{count} périodes en cours',
    de: '{count} laufende Zeiträume',
    es: '{count} periodos en curso',
  },
};

/**
 * @description True for a language of the integration.
 * @param {unknown} language - The language.
 * @returns {boolean} True when known.
 */
const isLanguage = (language) => LANGUAGES.includes(language);

/**
 * @description A text in a language, with its {placeholders} replaced.
 * @param {string} key - The TEXTS key.
 * @param {string} language - The language (English when unknown).
 * @param {object} [values] - The substitutions.
 * @returns {string} The text.
 * @example
 * t('type_root', 'fr'); // -> 'Jour racines'
 */
function t(key, language, values = {}) {
  const entry = TEXTS[key];
  if (!entry) {
    return key;
  }
  const template = entry[language] ?? entry.en;
  // A sentence ending on an abbreviated date ("Oct.") keeps one full stop.
  return template
    .replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''))
    .replace(/([.…])\.(?=\s|$)/g, '$1');
}

/**
 * @description The text in every language, for a multi-language message.
 * @param {string} key - The TEXTS key.
 * @param {object|Function} [values] - The substitutions, or `(language) => values`.
 * @returns {{ en: string, fr: string, de: string, es: string }} The message.
 */
function all(key, values = {}) {
  return Object.fromEntries(
    LANGUAGES.map((language) => [
      language,
      t(key, language, typeof values === 'function' ? values(language) : values),
    ]),
  );
}

/**
 * @description Truncate a text to a bound, with an ellipsis.
 * @param {string} value - The text.
 * @param {number} max - The bound.
 * @returns {string} The text.
 */
function clip(value, max) {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

const locale = (language) => (isLanguage(language) ? language : 'en');

/**
 * @description A calendar day written in a language: "Tuesday, April 28"
 * (long), "Thu, Apr 30" (short). Never shifted by a timezone.
 * @param {string} iso - YYYY-MM-DD.
 * @param {string} language - The language.
 * @param {'long'|'short'} [style] - The style.
 * @returns {string} The text.
 * @example
 * formatDay('2026-04-28', 'fr'); // -> 'mardi 28 avril'
 */
function formatDay(iso, language, style = 'long') {
  const [year, month, day] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(locale(language), {
    weekday: style,
    day: 'numeric',
    month: style,
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/**
 * @description A calendar day written briefly, without the weekday: "Nov 24",
 * "24 nov.".
 * @param {string} iso - YYYY-MM-DD.
 * @param {string} language - The language.
 * @returns {string} The text.
 */
function formatDate(iso, language) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(locale(language), {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/**
 * @description Two calendar days written as a range: "Apr 8 – 9", "8–9 avr.".
 * @param {string} from - YYYY-MM-DD.
 * @param {string} to - YYYY-MM-DD.
 * @param {string} language - The language.
 * @returns {string} The text.
 */
function formatDateRange(from, to, language) {
  const date = (iso) => {
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };
  return new Intl.DateTimeFormat(locale(language), {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).formatRange(date(from), date(to));
}

export { LANGUAGES, TEXTS, isLanguage, t, all, clip, formatDay, formatDate, formatDateRange };

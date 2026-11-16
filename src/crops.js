// -----------------------------------------------------------------------------
// The crops of the sowing calendar: 43 vegetables and 12 herbs.
//
// Each crop has a stable key (stored in the configuration, the scenes and the
// calendar event ids: never rename one), its group, the day type of the lunar
// gardening calendar it belongs to (Maria Thun method: fruit, root, flower,
// leaf), its name in the four languages, and up to four tasks:
//   - `sow_indoors`   sow under cover (greenhouse, windowsill, heated tray);
//   - `sow_outdoors`  sow in the open ground (or in a nursery bed);
//   - `plant_out`     plant out (seedlings, bulbs, sets, tubers, crowns);
//   - `harvest`       harvest.
// A task holds one or more ranges of half-months, "MMa" (1st to 15th) or
// "MMb" (16th to the end of the month): '02b-04a' runs from February 16 to
// April 15; '10a-03a' wraps over the new year. Ranges are separated by a
// comma.
//
// The dates are those of the reference climate, temperate: lowlands of the
// northern half of France, Belgium, the Swiss plateau, southern Germany
// (USDA zones 7b-8a), from the usual French gardening calendars. src/plan.js
// moves them for the other climate zones, the offset of the configuration
// and the southern hemisphere.
// -----------------------------------------------------------------------------

const TASKS = ['sow_indoors', 'sow_outdoors', 'plant_out', 'harvest'];
const GROUPS = ['vegetable', 'herb'];
const DAY_TYPES = ['fruit', 'root', 'flower', 'leaf'];

/**
 * @description One crop of the table.
 * @param {string} key - The stable key.
 * @param {string} group - vegetable or herb.
 * @param {string} type - fruit, root, flower or leaf.
 * @param {[string, string, string, string]} names - en, fr, de, es.
 * @param {object} tasks - `{ sow_indoors, sow_outdoors, plant_out, harvest }`, ranges.
 * @returns {object} The crop.
 */
const crop = (key, group, type, [en, fr, de, es], tasks) => ({
  key,
  group,
  type,
  name: { en, fr, de, es },
  tasks,
});

const V = 'vegetable';
const H = 'herb';

const CROPS = [
  // Fruit
  crop('tomato', V, 'fruit', ['Tomato', 'Tomate', 'Tomate', 'Tomate'], {
    sow_indoors: '02b-04a',
    plant_out: '05a-06a',
    harvest: '07a-10a',
  }),
  crop(
    'pepper',
    V,
    'fruit',
    ['Pepper and chili', 'Poivron et piment', 'Paprika und Chili', 'Pimiento y guindilla'],
    { sow_indoors: '02a-03b', plant_out: '05b-06a', harvest: '07b-10a' },
  ),
  crop('eggplant', V, 'fruit', ['Eggplant', 'Aubergine', 'Aubergine', 'Berenjena'], {
    sow_indoors: '02a-03b',
    plant_out: '05b-06a',
    harvest: '07b-09b',
  }),
  crop('cucumber', V, 'fruit', ['Cucumber', 'Concombre', 'Gurke', 'Pepino'], {
    sow_indoors: '04a-05a',
    sow_outdoors: '05b-06b',
    plant_out: '05b-06a',
    harvest: '07a-09b',
  }),
  crop('zucchini', V, 'fruit', ['Zucchini', 'Courgette', 'Zucchini', 'Calabacín'], {
    sow_indoors: '04a-05a',
    sow_outdoors: '05b-06b',
    plant_out: '05b-06a',
    harvest: '06b-10a',
  }),
  crop('squash', V, 'fruit', ['Winter squash', 'Courge et potiron', 'Kürbis', 'Calabaza'], {
    sow_indoors: '04a-05a',
    sow_outdoors: '05b-06a',
    plant_out: '05b-06a',
    harvest: '09a-10b',
  }),
  crop('melon', V, 'fruit', ['Melon', 'Melon', 'Melone', 'Melón'], {
    sow_indoors: '04a-05a',
    plant_out: '05b-06a',
    harvest: '07b-09a',
  }),
  crop('bean', V, 'fruit', ['Green bean', 'Haricot', 'Gartenbohne', 'Judía verde'], {
    sow_outdoors: '05a-07a',
    harvest: '07a-10a',
  }),
  crop('pea', V, 'fruit', ['Pea', 'Petit pois', 'Erbse', 'Guisante'], {
    sow_outdoors: '02b-04b',
    harvest: '05b-07a',
  }),
  crop('broad_bean', V, 'fruit', ['Broad bean', 'Fève', 'Dicke Bohne', 'Haba'], {
    sow_outdoors: '02a-04a',
    harvest: '05b-07a',
  }),
  crop('sweet_corn', V, 'fruit', ['Sweet corn', 'Maïs doux', 'Zuckermais', 'Maíz dulce'], {
    sow_indoors: '04b-05a',
    sow_outdoors: '05a-06a',
    plant_out: '05b-06a',
    harvest: '08a-09b',
  }),
  crop('strawberry', V, 'fruit', ['Strawberry', 'Fraisier', 'Erdbeere', 'Fresa'], {
    plant_out: '03a-04a,08b-09b',
    harvest: '05b-07a',
  }),

  // Root
  crop('carrot', V, 'root', ['Carrot', 'Carotte', 'Möhre', 'Zanahoria'], {
    sow_outdoors: '03a-07a',
    harvest: '06b-11b',
  }),
  crop('radish', V, 'root', ['Radish', 'Radis', 'Radieschen', 'Rábano'], {
    sow_outdoors: '03a-09a',
    harvest: '04a-10a',
  }),
  crop(
    'winter_radish',
    V,
    'root',
    ['Winter radish', 'Radis d’hiver', 'Winterrettich', 'Rábano de invierno'],
    { sow_outdoors: '07a-08b', harvest: '10a-12b' },
  ),
  crop('beetroot', V, 'root', ['Beetroot', 'Betterave', 'Rote Bete', 'Remolacha'], {
    sow_outdoors: '04b-07a',
    harvest: '07a-11a',
  }),
  crop('turnip', V, 'root', ['Turnip', 'Navet', 'Speiserübe', 'Nabo'], {
    sow_outdoors: '03a-04b,07b-09a',
    harvest: '05a-06b,10a-12a',
  }),
  crop('parsnip', V, 'root', ['Parsnip', 'Panais', 'Pastinake', 'Chirivía'], {
    sow_outdoors: '03b-05b',
    harvest: '10a-03a',
  }),
  crop('potato', V, 'root', ['Potato', 'Pomme de terre', 'Kartoffel', 'Patata'], {
    plant_out: '03b-05a',
    harvest: '06b-09b',
  }),
  crop('onion', V, 'root', ['Onion', 'Oignon', 'Zwiebel', 'Cebolla'], {
    sow_outdoors: '02b-04a',
    plant_out: '03a-04b',
    harvest: '07b-08b',
  }),
  crop('shallot', V, 'root', ['Shallot', 'Échalote', 'Schalotte', 'Chalota'], {
    plant_out: '02a-03b',
    harvest: '07a-08a',
  }),
  crop('garlic', V, 'root', ['Garlic', 'Ail', 'Knoblauch', 'Ajo'], {
    plant_out: '10b-12a,02a-03a',
    harvest: '06b-07b',
  }),
  crop('celeriac', V, 'root', ['Celeriac', 'Céleri-rave', 'Knollensellerie', 'Apionabo'], {
    sow_indoors: '02b-04a',
    plant_out: '05b-06b',
    harvest: '10a-11b',
  }),
  crop(
    'jerusalem_artichoke',
    V,
    'root',
    ['Jerusalem artichoke', 'Topinambour', 'Topinambur', 'Tupinambo'],
    { plant_out: '02b-04a', harvest: '10b-03a' },
  ),

  // Leaf
  crop('leek', V, 'leaf', ['Leek', 'Poireau', 'Lauch', 'Puerro'], {
    sow_outdoors: '03a-04b',
    plant_out: '06a-07b',
    harvest: '09a-03b',
  }),
  crop('lettuce', V, 'leaf', ['Lettuce', 'Laitue', 'Kopfsalat', 'Lechuga'], {
    sow_indoors: '02a-03b',
    sow_outdoors: '03b-08b',
    plant_out: '03b-09a',
    harvest: '04b-10b',
  }),
  crop('lambs_lettuce', V, 'leaf', ['Lamb’s lettuce', 'Mâche', 'Feldsalat', 'Canónigos'], {
    sow_outdoors: '07b-09b',
    harvest: '10a-03b',
  }),
  crop('rocket', V, 'leaf', ['Rocket', 'Roquette', 'Rucola', 'Rúcula'], {
    sow_outdoors: '03b-05b,08a-09b',
    harvest: '04b-06b,09b-11b',
  }),
  crop('spinach', V, 'leaf', ['Spinach', 'Épinard', 'Spinat', 'Espinaca'], {
    sow_outdoors: '03a-04b,08b-10a',
    harvest: '04b-06b,10a-12a',
  }),
  crop('chard', V, 'leaf', ['Swiss chard', 'Blette', 'Mangold', 'Acelga'], {
    sow_outdoors: '04b-06b',
    harvest: '07a-11b',
  }),
  crop(
    'endive',
    V,
    'leaf',
    ['Endive and escarole', 'Chicorée frisée et scarole', 'Endivie', 'Escarola'],
    { sow_outdoors: '06a-07b', plant_out: '07a-08b', harvest: '09a-11b' },
  ),
  crop('cabbage', V, 'leaf', ['Cabbage', 'Chou pommé', 'Kopfkohl', 'Repollo'], {
    sow_outdoors: '03b-05a',
    plant_out: '05b-07a',
    harvest: '08a-12a',
  }),
  crop(
    'brussels_sprouts',
    V,
    'leaf',
    ['Brussels sprouts', 'Chou de Bruxelles', 'Rosenkohl', 'Col de Bruselas'],
    { sow_outdoors: '04a-05a', plant_out: '06a-07a', harvest: '10b-02b' },
  ),
  crop('kale', V, 'leaf', ['Kale', 'Chou kale', 'Grünkohl', 'Col rizada'], {
    sow_outdoors: '05a-06b',
    plant_out: '06b-07b',
    harvest: '10b-03a',
  }),
  crop(
    'chinese_cabbage',
    V,
    'leaf',
    ['Chinese cabbage', 'Chou chinois', 'Chinakohl', 'Col china'],
    {
      sow_outdoors: '07a-08a',
      harvest: '09b-11b',
    },
  ),
  crop('kohlrabi', V, 'leaf', ['Kohlrabi', 'Chou-rave', 'Kohlrabi', 'Colinabo'], {
    sow_outdoors: '03a-07a',
    plant_out: '04a-07b',
    harvest: '06a-10b',
  }),
  crop('celery', V, 'leaf', ['Celery', 'Céleri branche', 'Staudensellerie', 'Apio'], {
    sow_indoors: '03a-04a',
    plant_out: '05b-06b',
    harvest: '08b-11a',
  }),
  crop('fennel', V, 'leaf', ['Florence fennel', 'Fenouil', 'Knollenfenchel', 'Hinojo'], {
    sow_outdoors: '06a-07b',
    harvest: '09a-11a',
  }),
  crop('asparagus', V, 'leaf', ['Asparagus', 'Asperge', 'Spargel', 'Espárrago'], {
    plant_out: '03b-04b',
    harvest: '04a-06a',
  }),
  crop('rhubarb', V, 'leaf', ['Rhubarb', 'Rhubarbe', 'Rhabarber', 'Ruibarbo'], {
    plant_out: '03a-03b,10b-11b',
    harvest: '04b-07a',
  }),

  // Flower
  crop('broccoli', V, 'flower', ['Broccoli', 'Brocoli', 'Brokkoli', 'Brócoli'], {
    sow_outdoors: '03b-06a',
    plant_out: '05a-07a',
    harvest: '07b-11a',
  }),
  crop('cauliflower', V, 'flower', ['Cauliflower', 'Chou-fleur', 'Blumenkohl', 'Coliflor'], {
    sow_outdoors: '03a-05b',
    plant_out: '05a-07a',
    harvest: '08a-11b',
  }),
  crop('artichoke', V, 'flower', ['Artichoke', 'Artichaut', 'Artischocke', 'Alcachofa'], {
    sow_indoors: '02b-03b',
    plant_out: '04a-05a',
    harvest: '06a-09b',
  }),

  // Herbs (grown for their leaves: leaf days)
  crop('basil', H, 'leaf', ['Basil', 'Basilic', 'Basilikum', 'Albahaca'], {
    sow_indoors: '03b-05a',
    sow_outdoors: '05b-06b',
    plant_out: '05b-06b',
    harvest: '06b-09b',
  }),
  crop('parsley', H, 'leaf', ['Parsley', 'Persil', 'Petersilie', 'Perejil'], {
    sow_outdoors: '03a-08a',
    harvest: '05a-12a',
  }),
  crop('chives', H, 'leaf', ['Chives', 'Ciboulette', 'Schnittlauch', 'Cebollino'], {
    sow_outdoors: '03b-05a',
    plant_out: '03a-04b,09b-10b',
    harvest: '04a-10b',
  }),
  crop('coriander', H, 'leaf', ['Coriander', 'Coriandre', 'Koriander', 'Cilantro'], {
    sow_outdoors: '04a-06a,08b-09a',
    harvest: '05b-07b,10a-11a',
  }),
  crop('dill', H, 'leaf', ['Dill', 'Aneth', 'Dill', 'Eneldo'], {
    sow_outdoors: '04a-06b',
    harvest: '06a-09a',
  }),
  crop('chervil', H, 'leaf', ['Chervil', 'Cerfeuil', 'Kerbel', 'Perifollo'], {
    sow_outdoors: '03a-05a,08b-09b',
    harvest: '04b-06b,10a-11b',
  }),
  crop('thyme', H, 'leaf', ['Thyme', 'Thym', 'Thymian', 'Tomillo'], {
    sow_indoors: '03a-04b',
    plant_out: '04b-05b,09b-10a',
    harvest: '05a-10b',
  }),
  crop('sage', H, 'leaf', ['Sage', 'Sauge', 'Salbei', 'Salvia'], {
    sow_indoors: '03b-04b',
    plant_out: '04a-05b,09b-10a',
    harvest: '05a-10b',
  }),
  crop('rosemary', H, 'leaf', ['Rosemary', 'Romarin', 'Rosmarin', 'Romero'], {
    plant_out: '04a-05b',
    harvest: '05a-10b',
  }),
  crop('mint', H, 'leaf', ['Mint', 'Menthe', 'Minze', 'Menta'], {
    plant_out: '03b-05a,09b-10b',
    harvest: '05a-10a',
  }),
  crop('oregano', H, 'leaf', ['Oregano', 'Origan', 'Oregano', 'Orégano'], {
    sow_indoors: '03a-04a',
    plant_out: '04b-05b',
    harvest: '06b-09a',
  }),
  crop('tarragon', H, 'leaf', ['Tarragon', 'Estragon', 'Estragon', 'Estragón'], {
    plant_out: '04a-05a',
    harvest: '06a-09b',
  }),
];

// The crops checked when the integration is installed: what most kitchen
// gardens grow. The user adds or removes crops in the configuration.
const DEFAULT_CROPS = [
  'tomato',
  'zucchini',
  'cucumber',
  'bean',
  'pea',
  'carrot',
  'radish',
  'potato',
  'onion',
  'garlic',
  'leek',
  'lettuce',
  'spinach',
  'strawberry',
  'basil',
  'parsley',
];

const BY_KEY = new Map(CROPS.map((entry) => [entry.key, entry]));

/**
 * @description A crop by its key.
 * @param {string} key - The key.
 * @returns {object|null} The crop.
 */
const cropOf = (key) => BY_KEY.get(key) ?? null;

/**
 * @description The name of a crop in a language (English when unknown).
 * @param {string} key - The crop key.
 * @param {string} language - The language.
 * @returns {string} The name.
 */
const cropName = (key, language) => {
  const entry = cropOf(key);
  if (!entry) return key;
  return entry.name[language] ?? entry.name.en;
};

/**
 * @description Read a half-month: "02b" -> 3 (0 = January 1-15, 23 = December 16-31).
 * @param {string} text - MMa or MMb.
 * @returns {number} The index.
 */
function parseHalf(text) {
  const match = /^(0[1-9]|1[0-2])([ab])$/.exec(text);
  if (!match) throw new Error(`invalid half-month "${text}"`);
  return (Number(match[1]) - 1) * 2 + (match[2] === 'b' ? 1 : 0);
}

/**
 * @description Read the ranges of a task: "03a-04b,07b-09a".
 * @param {string} text - The ranges.
 * @returns {Array<{ from: number, to: number }>} Half-month indexes, `to` included.
 * @example
 * parseRanges('02b-04a'); // -> [{ from: 3, to: 6 }]
 */
function parseRanges(text) {
  return String(text)
    .split(',')
    .map((part) => {
      const [from, to] = part.trim().split('-');
      return { from: parseHalf(from), to: parseHalf(to) };
    });
}

export { TASKS, GROUPS, DAY_TYPES, CROPS, DEFAULT_CROPS, cropOf, cropName, parseHalf, parseRanges };

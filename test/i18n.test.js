// Four languages everywhere: the runtime texts, the manifest, the
// documentation and the README (same structure, covers and illustrations).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { LANGUAGES, TEXTS } from '../src/i18n.js';
import { guessLanguage } from '../src/config.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const manifest = JSON.parse(read('../gladys-assistant-integration.json'));

test('every runtime text exists in the four languages, with the same placeholders', () => {
  for (const [key, entry] of Object.entries(TEXTS)) {
    const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const language of LANGUAGES) {
      assert.ok(entry[language], `${key}.${language}`);
      assert.deepEqual(placeholders(entry[language]), placeholders(entry.en), `${key}.${language}`);
    }
  }
});

/**
 * @description Every multi-language object of the manifest, with its path.
 * @param {unknown} node - A part of the manifest.
 * @param {string} path - Its path.
 * @returns {Array<[string, object]>} The objects.
 */
function texts(node, path = '') {
  if (Array.isArray(node)) return node.flatMap((item, i) => texts(item, `${path}[${i}]`));
  if (node === null || typeof node !== 'object') return [];
  if (typeof node.en === 'string') return [[path, node]];
  return Object.entries(node).flatMap(([key, value]) => texts(value, `${path}.${key}`));
}

test('every manifest text has the four languages', () => {
  for (const [path, value] of texts(manifest)) {
    for (const language of LANGUAGES) {
      assert.ok(value[language], `${path}.${language}`);
    }
  }
});

const headings = (text) => [...text.matchAll(/^(#{1,3}) /gm)].map((m) => m[1]).join('');

test('documentation and README in the four languages, same structure, with their images', () => {
  const docs = LANGUAGES.map((language) => read(`../docs/${language}.md`));
  const readmes = LANGUAGES.map((language) =>
    read(`../${language === 'en' ? 'README.md' : `README.${language}.md`}`),
  );
  LANGUAGES.forEach((language, i) => {
    assert.ok(docs[i].length > 300, `docs/${language}.md`);
    assert.equal(headings(docs[i]), headings(docs[0]), `docs/${language}.md structure`);
    assert.equal(headings(readmes[i]), headings(readmes[0]), `README ${language} structure`);
    assert.ok(
      existsSync(new URL(`../docs/assets/widgets.${language}.png`, import.meta.url)),
      language,
    );
    assert.match(
      readmes[i],
      new RegExp(`\\(docs/assets/widgets\\.${language}\\.png\\)`),
      `README ${language}`,
    );
    assert.match(
      docs[i],
      new RegExp(`raw\\.githubusercontent\\.com/[^)]+/docs/assets/widgets\\.${language}\\.png`),
      `docs/${language}.md`,
    );
    assert.match(readmes[i], /\]\(cover\.jpg\)/, `cover in README ${language}`);
  });
});

test('the automatic language is guessed from the timezone before any widget', () => {
  assert.deepEqual(
    [
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Madrid',
      'America/Argentina/Cordoba',
      'Asia/Tokyo',
    ].map(guessLanguage),
    ['fr', 'de', 'es', 'es', 'en'],
  );
});

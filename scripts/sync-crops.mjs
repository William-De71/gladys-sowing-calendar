#!/usr/bin/env node
// Copy the crops of src/crops.js into the four crop lists of the manifest
// (configuration `crops` and its default, widget setting `crop`, trigger
// fields `crop`), then run Prettier on it. Nothing else of the manifest
// changes (the version belongs to the Release workflow).
//
// Multi-language texts are written on one line: Prettier keeps an object
// collapsed when it fits, and the store indexer refuses a manifest over
// 100 KB (test/manifest.test.js checks the size).
//
// Usage: node scripts/sync-crops.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { CROPS, DEFAULT_CROPS } from '../src/crops.js';

const path = new URL('../gladys-assistant-integration.json', import.meta.url);
const manifest = JSON.parse(readFileSync(path, 'utf8'));
const options = CROPS.map((crop) => ({ value: crop.key, label: { ...crop.name } }));
const byKey = (list, key) => list.find((entry) => entry.key === key);

const crops = byKey(manifest.config_schema, 'crops');
crops.options = options;
crops.default = DEFAULT_CROPS;
byKey(byKey(manifest.widgets, 'crop').settings, 'crop').options = options;
for (const trigger of ['window_opened', 'window_closing']) {
  byKey(byKey(manifest.scene_triggers, trigger).fields, 'crop').options = options;
}

/**
 * @description JSON with the multi-language objects and the scalar arrays on one line.
 * @param {unknown} node - A value.
 * @param {string} [indent] - The current indentation.
 * @returns {string} The JSON text.
 */
function compact(node, indent = '') {
  const inner = `${indent}  `;
  if (Array.isArray(node)) {
    if (node.every((item) => typeof item !== 'object')) {
      return JSON.stringify(node).replace(/","/g, '", "');
    }
    return `[\n${node.map((item) => inner + compact(item, inner)).join(',\n')}\n${indent}]`;
  }
  if (node && typeof node === 'object') {
    const entries = Object.entries(node);
    if (typeof node.en === 'string' && entries.every(([, value]) => typeof value === 'string')) {
      const pairs = entries.map(
        ([key, value]) => `${JSON.stringify(key)}: ${JSON.stringify(value)}`,
      );
      return `{ ${pairs.join(', ')} }`;
    }
    const lines = entries.map(
      ([key, value]) => `${inner}${JSON.stringify(key)}: ${compact(value, inner)}`,
    );
    return `{\n${lines.join(',\n')}\n${indent}}`;
  }
  return JSON.stringify(node);
}

writeFileSync(path, `${compact(manifest)}\n`);
execFileSync('npx', ['prettier', '--write', 'gladys-assistant-integration.json'], {
  cwd: new URL('..', import.meta.url),
  stdio: 'inherit',
});

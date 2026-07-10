// Port of utils/updater.py (update_dataset only).
//
// update_images() is intentionally NOT ported for the discovery step — it only
// copies PNG/atlas assets out of the datamine and has no bearing on the JSON
// vehicle data. See README.node.md.

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { data, COUNTRIES, AIR_CLASSES, GROUND_CLASSES, SEA_CLASSES } from './constants.js';

// Reads wpcost and, per country, writes the lists of air/ground/sea unit
// identifiers into nations/<country>/country_<country>_<type>.json.
export function updateDataset(nationsDir) {
  const wpcost = data.WPCOST;
  const air = new Set(AIR_CLASSES);
  const ground = new Set(GROUND_CLASSES);
  const sea = new Set(SEA_CLASSES);

  for (const n of COUNTRIES) {
    const airList = [];
    const groundList = [];
    const seaList = [];
    const countryDir = path.join(nationsDir, n);
    mkdirSync(countryDir, { recursive: true });

    for (const i of Object.keys(wpcost)) {
      const entry = wpcost[i];
      // Guard against non-unit entries (e.g. economicRankMax) that the Python
      // version deletes up front; they have no unitClass/country.
      if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) continue;
      if (!('unitClass' in entry) || !('country' in entry)) continue;

      if (air.has(entry.unitClass) && entry.country === 'country_' + n) airList.push(i);
      else if (ground.has(entry.unitClass) && entry.country === 'country_' + n) groundList.push(i);
      else if (sea.has(entry.unitClass) && entry.country === 'country_' + n) seaList.push(i);
    }

    if (airList.length !== 0) writeFileSync(path.join(countryDir, `country_${n}_air.json`), JSON.stringify(airList, null, 3));
    if (groundList.length !== 0) writeFileSync(path.join(countryDir, `country_${n}_ground.json`), JSON.stringify(groundList, null, 3));
    if (seaList.length !== 0) writeFileSync(path.join(countryDir, `country_${n}_sea.json`), JSON.stringify(seaList, null, 3));
  }
}

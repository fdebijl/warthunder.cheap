// Port of utils/simple_functions.py
//
// Faithful ports of the Python helpers. `myFetch` intentionally THROWS when a
// file is missing (Python `open` raised FileNotFoundError), which the caller
// relies on to drop a whole vehicle when one of its weapon files is absent.
// `getJson` returns null when the file is missing (used for optional configs).

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { data } from './constants.js';

export function myFetch(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

export function getJson(filePath) {
  if (existsSync(filePath)) {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  }
  return null;
}

export function dictHasKeyInsensitive(dictionary, keyName) {
  const target = keyName.toLowerCase();
  return Object.keys(dictionary).some((k) => k.toLowerCase() === target);
}

export function dictKeysToList(d) {
  return Object.keys(d);
}

export function getVersion() {
  // Mirror of getVersion(): read the datamine's latest commit message.
  try {
    return execFileSync('git', ['log', '-1', '--pretty=%B'], {
      cwd: data.datamineLocation,
      encoding: 'utf-8',
    }).trim();
  } catch (e) {
    console.error(`Error reading Git commit message: ${e.message}`);
    return null;
  }
}

// Port of value_from_dict. Note the original only treats a MISSING key as the
// fallback trigger — a present key with a null value returns that null. We
// mirror that with `in`/hasOwnProperty rather than `?.`.
export function valueFromDict(dictionary, key, fallbackValue = null) {
  if (dictionary === null || dictionary === undefined || key === null || key === undefined) {
    return fallbackValue;
  }
  if (typeof dictionary !== 'object') return fallbackValue;
  return Object.prototype.hasOwnProperty.call(dictionary, key) ? dictionary[key] : fallbackValue;
}

// Python's proper_round: round-half-away-from-zero.
export function properRound(num) {
  const absValue = Math.abs(num);
  if (absValue - Math.trunc(absValue) >= 0.5) {
    return num > 0 ? Math.trunc(num) + 1 : Math.trunc(num) - 1;
  }
  return Math.trunc(num);
}

export function traverseShop(shop, lookupKey = null, lookupAttribute = 'marketplaceItemdefId') {
  if (Array.isArray(shop)) {
    for (const techtree of shop) {
      if (traverseShop(techtree, lookupKey, lookupAttribute)) return true;
    }
  } else if (shop !== null && typeof shop === 'object') {
    for (const key of Object.keys(shop)) {
      if (key !== 'image' && key !== 'reqAir') {
        if (!key.includes('_group')) {
          if (key === lookupKey && valueFromDict(shop[key], lookupAttribute) !== null) {
            return true;
          }
        }
        if (key.includes('_group')) {
          if (traverseShop(shop[key], lookupKey, lookupAttribute)) return true;
        }
      }
    }
  }
  return false;
}

export function getTypeKey(vehicleType) {
  const typeKeyMapping = {
    fighter: 'aviation',
    assault: 'aviation',
    bomber: 'aviation',
    attack_helicopter: 'helicopters',
    utility_helicopter: 'helicopters',

    tank: 'army',
    light_tank: 'army',
    medium_tank: 'army',
    heavy_tank: 'army',
    tank_destroyer: 'army',
    spaa: 'army',
    lbv: 'army',
    mbv: 'army',
    hbv: 'army',
    exoskeleton: 'army',

    ship: 'ships',
    light_cruiser: 'ships',
    frigate: 'ships',
    heavy_cruiser: 'ships',
    battlecruiser: 'ships',
    destroyer: 'ships',
    submarine: 'ships',
    battleship: 'ships',
  };
  return Object.prototype.hasOwnProperty.call(typeKeyMapping, vehicleType) ? typeKeyMapping[vehicleType] : 'boats';
}

export function isVehicleOnMarketplace(shop, identifier, country, vehicleType) {
  const countryKey = 'country_' + country;
  const typeKey = getTypeKey(vehicleType);
  return traverseShop(shop[countryKey][typeKey].range, identifier);
}

export function isSquadronVehicle(shop, wpcost, identifier, country, vehicleType) {
  const countryKey = 'country_' + country;
  const typeKey = getTypeKey(vehicleType);
  const shopResult = traverseShop(shop[countryKey][typeKey].range, identifier, 'isClanVehicle');
  const wpcostResult = valueFromDict(wpcost[identifier], 'researchType', false);
  return shopResult || wpcostResult === 'clanVehicle';
}

export function isPack(shop, identifier, country, vehicleType) {
  const countryKey = 'country_' + country;
  const typeKey = getTypeKey(vehicleType);
  return traverseShop(shop[countryKey][typeKey].range, identifier, 'gift');
}

// group_and_increment: keep the first item seen per property value, summing counts.
export function groupAndIncrement(items, propertyName) {
  const itemMap = new Map();
  for (const item of items) {
    const value = item[propertyName];
    if (!itemMap.has(value)) {
      itemMap.set(value, item);
    } else {
      itemMap.get(value).count += item.count;
    }
  }
  return [...itemMap.values()];
}

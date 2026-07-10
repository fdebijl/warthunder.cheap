// Port of utils/update_localization.py.
//
// Deviation from the Python: generate_locales() there reads the vehicle
// identifiers and modification names back out of the freshly-written SQLite DB.
// Since this port does not build the SQLite DB (see README.node.md), we instead
// take the in-memory extracted vehicles directly. The produced locale files are
// equivalent — the DB was only ever an intermediary. Weapon/ammo/explosive/
// ammo-type name sources come from the same ALL_* sets populated during
// extraction, exactly as in Python.

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { data } from './constants.js';
import { ALL_WEAPONS, ALL_AMMOS, ALL_AMMO_TYPES, ALL_EXPLOSIVES } from './vehicle.js';

const LANGUAGES = {
  Belarusian: 'be',
  Czech: 'cs',
  German: 'de',
  English: 'en',
  Spanish: 'es',
  French: 'fr',
  Hungarian: 'hu',
  Italian: 'it',
  Japanese: 'ja',
  Korean: 'ko',
  Polish: 'pl',
  Portuguese: 'pt',
  Romanian: 'ro',
  Russian: 'ru',
  Serbian: 'sr',
  Turkish: 'tr',
  Ukrainian: 'uk',
  Vietnamese: 'vi',
  Chinese: 'zh',
};

function emptyTemplate() {
  return { vehicles: {}, modifications: {}, weapons: {}, ammos: {}, ammo_types: {}, explosives: {} };
}

// Minimal but correct RFC-4180-style parser adapted for the WT lang CSVs:
// delimiter ';', fields quoted with '"', embedded quotes escaped as '""',
// quoted fields may contain ';' and newlines. Returns { colIndex, rows } where
// rows maps the first-column ID to the raw string[] of that row.
function parseCsv(filePath) {
  const text = readFileSync(filePath, 'utf-8');
  const rows = [];
  let field = '';
  let record = [];
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  const pushField = () => { record.push(field); field = ''; };
  const pushRecord = () => { rows.push(record); record = []; };

  while (i < len) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += ch; i++; continue;
    }
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === ';') { pushField(); i++; continue; }
    if (ch === '\r') { i++; continue; }
    if (ch === '\n') { pushField(); pushRecord(); i++; continue; }
    field += ch; i++;
  }
  // Flush trailing field/record if the file did not end with a newline.
  if (field.length > 0 || record.length > 0) { pushField(); pushRecord(); }

  const header = rows.shift() ?? [];
  const colIndex = new Map();
  header.forEach((name, idx) => { if (!colIndex.has(name)) colIndex.set(name, idx); });

  const index = new Map();
  for (const r of rows) {
    const id = r[0];
    if (id === undefined) continue;
    // First occurrence wins (mirrors taking the first .loc match).
    if (!index.has(id)) index.set(id, r);
  }
  return { colIndex, index };
}

function makeLookup(filePath) {
  const { colIndex, index } = parseCsv(filePath);
  // Returns the localized cell, or undefined if the row or column is absent.
  return (id, langName) => {
    const row = index.get(id);
    if (row === undefined) return undefined;
    const col = colIndex.get(`<${langName}>`);
    if (col === undefined) return undefined;
    const val = row[col];
    return val === undefined || val === '' ? undefined : val;
  };
}

export function generateLocales(destinationPath, vehicles) {
  const unitsLookup = makeLookup(data.LANG_UNITS);
  const modsLookup = makeLookup(path.join(path.dirname(data.LANG_UNITS), 'units_modifications.csv'));
  const weaponryLookup = makeLookup(data.LANG_WEAPONS);

  const languageData = {};
  for (const langName of Object.keys(LANGUAGES)) languageData[langName] = emptyTemplate();

  const vehicleIdentifiers = vehicles.map((v) => v.identifier);
  const modificationNames = new Set();
  for (const v of vehicles) {
    for (const mod of v.modifications ?? []) modificationNames.add(mod.name);
  }

  console.log('Localizing vehicles');
  for (const identifier of vehicleIdentifiers) {
    let realId = identifier;
    if (identifier.includes('football')) realId = 'us_m551';
    for (const langName of Object.keys(LANGUAGES)) {
      const short = unitsLookup(realId + '_shop', langName);
      const extended = unitsLookup(realId + '_0', langName);
      // Python only skips on a missing ROW (KeyError). A present row still
      // assigns (possibly empty). We approximate: skip only when both lookups
      // find no row at all, otherwise assign what we have.
      if (short !== undefined) languageData[langName].vehicles[realId.toLowerCase() + '_short'] = short;
      if (extended !== undefined) languageData[langName].vehicles[realId.toLowerCase() + '_extended'] = extended;
    }
  }

  console.log('Localizing modifications');
  for (const mod of modificationNames) {
    for (const langName of Object.keys(LANGUAGES)) {
      const localizedMod = modsLookup('modification/' + mod, langName);
      const localizedModDesc = modsLookup('modification/' + mod + '/desc', langName);
      if (localizedMod && localizedModDesc) {
        languageData[langName].modifications[mod.toLowerCase()] = localizedMod;
        languageData[langName].modifications[mod.toLowerCase() + '_desc'] = localizedModDesc;
      }
    }
  }

  console.log('Localizing weapons');
  for (const weapon of ALL_WEAPONS) {
    for (const langName of Object.keys(LANGUAGES)) {
      const weaponName = weaponryLookup(`weapons/${weapon}`, langName);
      if (weaponName) languageData[langName].weapons[weapon.toLowerCase()] = weaponName;
    }
  }

  console.log('Localizing ammos');
  for (const ammo of ALL_AMMOS) {
    for (const langName of Object.keys(LANGUAGES)) {
      const ammoName = weaponryLookup(ammo, langName);
      if (ammoName) languageData[langName].ammos[String(ammo).toLowerCase()] = ammoName;
    }
  }

  console.log('Localizing explosives');
  for (const explosive of ALL_EXPLOSIVES) {
    for (const langName of Object.keys(LANGUAGES)) {
      const explosiveName = weaponryLookup(`explosiveType/${explosive}`, langName);
      if (explosiveName) languageData[langName].explosives[String(explosive).toLowerCase()] = explosiveName;
    }
  }

  console.log('Localizing ammo types');
  for (const ammoType of ALL_AMMO_TYPES) {
    for (const langName of Object.keys(LANGUAGES)) {
      const ammoTypeName = weaponryLookup(ammoType + '/name', langName);
      const ammoTypeNameShort = weaponryLookup(ammoType + '/name/short', langName);
      if (ammoTypeName) {
        languageData[langName].ammo_types[String(ammoType).toLowerCase()] = ammoTypeName;
        languageData[langName].ammo_types[String(ammoType).toLowerCase() + '_short'] = ammoTypeNameShort ?? null;
      }
    }
  }

  // sanitize_language_data: strip non-breaking spaces from vehicle names.
  for (const langName of Object.keys(LANGUAGES)) {
    const vehiclesMap = languageData[langName].vehicles;
    for (const key of Object.keys(vehiclesMap)) {
      vehiclesMap[key] = vehiclesMap[key].replace(/\u00a0/g, " ");
    }
  }

  mkdirSync(destinationPath, { recursive: true });
  for (const [langName, isoCode] of Object.entries(LANGUAGES)) {
    const filePath = path.join(destinationPath, `${isoCode}.json`);
    let dataToWrite;
    if (existsSync(filePath)) {
      const existing = JSON.parse(readFileSync(filePath, 'utf-8'));
      dataToWrite = { ...existing, ...languageData[langName] };
    } else {
      dataToWrite = languageData[langName];
    }
    writeFileSync(filePath, JSON.stringify(dataToWrite, null, 3));
  }
}

#!/usr/bin/env node
// Port of main.py — orchestration entry point.
//
// The Python version uses asyncio with a 20-way semaphore, but every underlying
// operation (create_vehicle) is blocking file I/O + JSON parsing. In Node with
// synchronous fs that gives no speedup, so we process sequentially per
// (country, type). The output JSON is identical either way.
//
// Usage:
//   node src/main.js --datamine <path-to-datamine> [--out <output-dir>] [--no-locales]
//   (or set DATAMINE_LOCATION in the environment)

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initConstants, COUNTRIES, VEHICLE_FETCH_URI } from './constants.js';
import { createVehicle } from './vehicle.js';
import { vehicleToJson } from './classes.js';
import { updateDataset } from './updater.js';
import { generateLocales } from './localization.js';
import { writeVehicleDb } from './sqlite.js';

function parseArgs(argv) {
  const args = { datamine: process.env.DATAMINE_LOCATION ?? null, out: null, locales: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--datamine') args.datamine = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--no-locales') args.locales = false;
    else if (!args.datamine) args.datamine = a; // positional fallback
  }
  return args;
}

const VEHICLE_TYPES = [
  { key: 'air', uri: VEHICLE_FETCH_URI.air, label: 'Aircraft' },
  { key: 'ground', uri: VEHICLE_FETCH_URI.ground, label: 'Tank' },
  { key: 'sea', uri: VEHICLE_FETCH_URI.sea, label: 'Ship' },
];

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.datamine) {
    console.error('ERROR: datamine path not provided. Pass --datamine <path> or set DATAMINE_LOCATION.');
    process.exit(1);
  }
  const datamine = path.resolve(args.datamine);
  if (!existsSync(datamine)) {
    console.error(`ERROR: datamine path does not exist: ${datamine}`);
    process.exit(1);
  }

  const toolRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const outDir = path.resolve(args.out ?? path.join(toolRoot, 'output'));
  const nationsDir = path.join(outDir, 'nations');
  const localesDir = path.join(outDir, 'locales');
  mkdirSync(outDir, { recursive: true });

  console.log(`[wt-extract] datamine: ${datamine}`);
  console.log(`[wt-extract] output:   ${outDir}`);

  console.time('[wt-extract] initConstants');
  initConstants(datamine);
  console.timeEnd('[wt-extract] initConstants');

  console.log('[wt-extract] Building nation unit lists (update_dataset)...');
  updateDataset(nationsDir);

  const allVehicles = [];
  const stats = { processed: 0, ok: 0, dropped: 0, byType: {} };
  const droppedSamples = [];

  console.time('[wt-extract] extraction');
  for (const country of COUNTRIES) {
    for (const vt of VEHICLE_TYPES) {
      const inFile = path.join(nationsDir, country, `country_${country}_${vt.key}.json`);
      if (!existsSync(inFile)) continue;
      const names = JSON.parse(readFileSync(inFile, 'utf-8'));
      if (!names || names.length === 0) continue;

      const finalVehicles = [];
      for (const name of names) {
        stats.processed++;
        try {
          const result = createVehicle(name, vt.uri);
          if (result !== null && result !== undefined) {
            const json = vehicleToJson(result);
            finalVehicles.push(json);
            allVehicles.push(json);
            stats.ok++;
          } else {
            stats.dropped++;
            if (droppedSamples.length < 25) droppedSamples.push(`${name} (${vt.key}): returned null`);
          }
        } catch (e) {
          stats.dropped++;
          if (droppedSamples.length < 25) droppedSamples.push(`${name} (${vt.key}): ${e.message}`);
        }
      }

      stats.byType[vt.label] = (stats.byType[vt.label] ?? 0) + finalVehicles.length;
      const outFile = path.join(nationsDir, country, `${country}Final${vt.label}s.json`);
      writeFileSync(outFile, JSON.stringify(finalVehicles, null, 2));
      console.log(`  ${country}/${vt.key}: ${finalVehicles.length}/${names.length}`);
    }
  }
  console.timeEnd('[wt-extract] extraction');

  // Value-add over the Python tool: a single consolidated file of every vehicle,
  // which is the shape a downstream consumer (warthunder.cheap) actually wants.
  writeFileSync(path.join(outDir, 'vehicles.json'), JSON.stringify(allVehicles, null, 2));

  if (args.locales) {
    console.time('[wt-extract] localization');
    generateLocales(localesDir, allVehicles);
    console.timeEnd('[wt-extract] localization');

    // SQLite DB (id -> full JSON blob) for fast key lookup by the API + scraper matcher.
    // Requires localized names, so it runs only when locales are generated.
    console.time('[wt-extract] sqlite');
    const { dbPath, count } = writeVehicleDb(outDir, allVehicles);
    console.timeEnd('[wt-extract] sqlite');
    console.log(`  sqlite: ${dbPath} (${count} vehicles)`);
  } else {
    console.warn('[wt-extract] --no-locales set: skipping SQLite DB (it needs localized names)');
  }

  console.log('\n[wt-extract] ==== Summary ====');
  console.log(`  processed: ${stats.processed}`);
  console.log(`  extracted: ${stats.ok}`);
  console.log(`  dropped:   ${stats.dropped}`);
  console.log(`  by type:   ${JSON.stringify(stats.byType)}`);
  console.log(`  consolidated: ${path.join(outDir, 'vehicles.json')} (${allVehicles.length} vehicles)`);
  if (droppedSamples.length > 0) {
    console.log('\n[wt-extract] sample drops (first 25):');
    for (const d of droppedSamples) console.log(`    - ${d}`);
  }
}

main();

// Emit a SQLite database of the extracted vehicles for fast key-based lookup by
// the API (and as the scraper matcher's reference corpus). One row per vehicle:
//   vehicles(id TEXT PRIMARY KEY, data TEXT)   -- data = full vehicle JSON blob
// Plus a small meta table. Uses Node's built-in node:sqlite (no native deps).
//
// The blob embeds `localizedNames` (short + extended per locale) so consumers get
// display names without a second lookup, and the matcher can build its name corpus.
//
// NOT culled: a few store packs map to vehicles the datamine does not flag as
// premium/pack (e.g. tech-tree vehicles sold as packs), so culling to "sellable"
// would drop valid matches. The full DB is ~50 MB, which is fine for SQLite.

import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';

function loadLocalizedNames(localesDir) {
  const short = new Map(); // lower-id -> { lang: name }
  const extended = new Map();
  if (!existsSync(localesDir)) return { short, extended };
  for (const file of readdirSync(localesDir)) {
    if (!file.endsWith('.json')) continue;
    const lang = file.replace('.json', '');
    const loc = JSON.parse(readFileSync(path.join(localesDir, file), 'utf-8'));
    for (const [key, value] of Object.entries(loc.vehicles ?? {})) {
      const m = key.match(/^(.*)_(short|extended)$/);
      if (!m || !value) continue;
      const target = m[2] === 'short' ? short : extended;
      const entry = target.get(m[1]) ?? {};
      entry[lang] = value;
      target.set(m[1], entry);
    }
  }
  return { short, extended };
}

export function writeVehicleDb(outDir, allVehicles) {
  const dbPath = path.join(outDir, 'vehicles.sqlite');
  // Remove any prior DB (and stray WAL/journal siblings) for a clean rebuild.
  for (const suffix of ['', '-wal', '-shm', '-journal']) {
    const p = dbPath + suffix;
    if (existsSync(p)) rmSync(p);
  }

  const { short, extended } = loadLocalizedNames(path.join(outDir, 'locales'));

  const db = new DatabaseSync(dbPath);
  db.exec('CREATE TABLE vehicles (id TEXT PRIMARY KEY, data TEXT NOT NULL)');
  db.exec('CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT)');

  const insert = db.prepare('INSERT INTO vehicles (id, data) VALUES (?, ?)');
  db.exec('BEGIN');
  for (const v of allVehicles) {
    const low = v.identifier.toLowerCase();
    const blob = {
      ...v,
      localizedNames: { short: short.get(low) ?? {}, extended: extended.get(low) ?? {} },
    };
    insert.run(v.identifier, JSON.stringify(blob));
  }
  db.exec('COMMIT');

  const metaInsert = db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)');
  metaInsert.run('version', allVehicles[0]?.version ?? 'unknown');
  metaInsert.run('vehicle_count', String(allVehicles.length));

  db.close();
  return { dbPath, count: allVehicles.length };
}

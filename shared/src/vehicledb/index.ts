// Read-only access to the SQLite datamine vehicle DB produced by the extractor.
//
// Schema: vehicles(id TEXT PRIMARY KEY, data TEXT) where data is the full vehicle
// JSON blob (+ embedded localizedNames), and meta(key, value). Uses Node's
// built-in node:sqlite — no native dependency. The DB is baked into the API and
// scraper images; its path comes from VEHICLE_DB_PATH.

import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

import { VEHICLE_DB_PATH } from '../constants.js';
import { VehicleRef } from '../domain/index.js';
import { classifyVehicleType } from './classify.js';

export * from './classify.js';

let db: DatabaseSync | null = null;
let opened = false;

function getDb(): DatabaseSync | null {
  if (opened) return db;
  opened = true;
  if (!existsSync(VEHICLE_DB_PATH)) {
    db = null;
    return null;
  }
  db = new DatabaseSync(VEHICLE_DB_PATH, { readOnly: true });
  return db;
}

/** Whether the vehicle DB file is present and usable. */
export function vehicleDbAvailable(): boolean {
  return getDb() !== null;
}

/** Raw JSON blob string for a datamine id, or null. This is what the API serves verbatim. */
export function getVehicleBlob(identifier: string): string | null {
  const handle = getDb();
  if (!handle) return null;
  const row = handle.prepare('SELECT data FROM vehicles WHERE id = ?').get(identifier) as { data: string } | undefined;
  return row?.data ?? null;
}

/** Parsed vehicle blob for a datamine id, or null. */
export function getVehicle(identifier: string): Record<string, unknown> | null {
  const blob = getVehicleBlob(identifier);
  return blob ? JSON.parse(blob) : null;
}

interface VehicleBlob {
  identifier: string;
  country: string;
  vehicle_type: string | null;
  is_premium?: boolean;
  is_pack?: boolean;
  on_marketplace?: boolean;
  squadron_vehicle?: boolean;
  realistic_br?: number | null;
  localizedNames?: { short?: Record<string, string>; extended?: Record<string, string> };
}

/**
 * Load every vehicle as a match-focused {@link VehicleRef}. Used by the scraper's
 * matcher to build its index. Returns [] if the DB is absent.
 */
export function loadVehicleRefs(): VehicleRef[] {
  const handle = getDb();
  if (!handle) return [];
  const rows = handle.prepare('SELECT data FROM vehicles').all() as { data: string }[];
  return rows.map((row) => {
    const v = JSON.parse(row.data) as VehicleBlob;
    const names = new Set<string>();
    for (const map of [v.localizedNames?.short, v.localizedNames?.extended]) {
      for (const name of Object.values(map ?? {})) if (name) names.add(name);
    }
    return {
      identifier: v.identifier,
      country: v.country,
      vehicleType: v.vehicle_type,
      isPremium: !!v.is_premium,
      isPack: !!v.is_pack,
      onMarketplace: !!v.on_marketplace,
      squadronVehicle: !!v.squadron_vehicle,
      realisticBr: typeof v.realistic_br === 'number' ? v.realistic_br : null,
      vehicleClass: classifyVehicleType(v.vehicle_type),
      names: [...names],
    };
  });
}

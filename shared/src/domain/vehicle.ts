/**
 * A datamine vehicle reference entry, distilled from the War Thunder datamine by
 * the `extractor` package. Stored in the `vehicles` collection and used by the
 * scraper's matcher to link store items to real vehicles.
 *
 * This is intentionally a match-focused subset. When the API begins serving full
 * datamine stats (see the details dialog), extend this type and the import to
 * carry the remaining fields from the extractor output.
 */
export interface VehicleRef {
  /** Datamine identifier, e.g. `a_10a_early`. Unique key of the `vehicles` collection. */
  identifier: string;
  /** Datamine country slug, e.g. `usa`. Matches the store item's `nation` slug 1:1. */
  country: string;
  /** Vehicle type, e.g. `medium_tank`, `assault`, `battleship`. */
  vehicleType: string | null;
  /** Whether the vehicle is a premium (bought with Golden Eagles or a pack). */
  isPremium: boolean;
  /** Whether the vehicle is sold as a standalone pack. */
  isPack: boolean;
  /** Whether the vehicle is tradeable on the marketplace. */
  onMarketplace: boolean;
  /** Whether the vehicle is a squadron vehicle. */
  squadronVehicle: boolean;
  /** Realistic-battles battle rating (e.g. 9.3), the headline BR shown on cards. Null if unknown. */
  realisticBr: number | null;
  /** Broad class derived from the vehicle type: 'Tank' | 'Plane' | 'Helicopter' | 'Ship'. */
  vehicleClass: string | null;
  /** Deduped short + extended localized names across all locales, used for fuzzy matching. */
  names: string[];
}

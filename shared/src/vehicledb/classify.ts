// Map a granular datamine vehicle type (e.g. `medium_tank`, `attack_helicopter`,
// `battleship`) to a broad class used for the website's vehicle-type filter and
// the denormalized `Item.vehicleClass`.

const AIR_PLANES = new Set(['fighter', 'assault', 'bomber']);
const NAVAL = new Set([
  'ship', 'destroyer', 'light_cruiser', 'boat', 'heavy_boat', 'barge',
  'frigate', 'heavy_cruiser', 'battlecruiser', 'battleship', 'submarine',
]);

export type VehicleClass = 'Tank' | 'Plane' | 'Helicopter' | 'Ship';

export function classifyVehicleType(vehicleType: string | null | undefined): VehicleClass | null {
  if (!vehicleType) return null;
  const t = vehicleType.toLowerCase();
  if (t.includes('helicopter')) return 'Helicopter';
  if (AIR_PLANES.has(t)) return 'Plane';
  if (NAVAL.has(t)) return 'Ship';
  return 'Tank'; // all ground types (light_tank, medium_tank, spaa, lbv, …)
}

// Port of utils/constants.py
//
// The big datamine config files are loaded once via initConstants() so that the
// DATAMINE_LOCATION can be supplied at runtime (in Python they were read at import
// time from an .env file). Everything downstream reads from the exported `data`
// singleton, mirroring the module-level globals of the original.

import { readFileSync } from 'node:fs';
import path from 'node:path';

export const data = {
  datamineLocation: null,
  WPCOST: null,
  UNIT_TAGS: null,
  SHOP: null,
  MODIFICATIONS: null,
  LANG_UNITS: null,
  LANG_WEAPONS: null,
  URL_VROMFS: null,
};

function loadJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

export function initConstants(datamineLocation) {
  data.datamineLocation = datamineLocation;
  data.WPCOST = loadJson(path.join(datamineLocation, 'char.vromfs.bin_u/config/wpcost.blkx'));
  data.UNIT_TAGS = loadJson(path.join(datamineLocation, 'char.vromfs.bin_u/config/unittags.blkx'));
  data.SHOP = loadJson(path.join(datamineLocation, 'char.vromfs.bin_u/config/shop.blkx'));
  data.MODIFICATIONS = loadJson(path.join(datamineLocation, 'char.vromfs.bin_u/config/modifications.blkx')).modifications;
  data.LANG_UNITS = path.join(datamineLocation, 'lang.vromfs.bin_u/lang/units.csv');
  data.LANG_WEAPONS = path.join(datamineLocation, 'lang.vromfs.bin_u/lang/units_weaponry.csv');
  // Trailing slash preserved: downstream builds `${URL_VROMFS}gamedata/...`
  data.URL_VROMFS = path.join(datamineLocation, 'aces.vromfs.bin_u') + path.sep;
}

export const COUNTRIES = ['britain', 'china', 'france', 'germany', 'israel', 'italy', 'japan', 'sweden', 'usa', 'ussr'];

export const VEHICLE_FETCH_URI = {
  ground: '/units/tankmodels',
  sea: '/units/ships',
  air: '/flightmodels',
  air_fm: '/flightmodels/fm',
};

export const ENGINE_HP_AB_MUL_TANK = 1.908;
export const ENGINE_SPEED_AB_MUL_TANK = 1.101;
export const ENGINE_SPEED_AB_MUL_SHIP = 1.222;
export const ENGINE_SPEED_AB_MUL_AIR = 1.037;

export const CANNON_TYPE = 'bullet';
export const ROCKET_TYPE = 'rocketGun';
export const TORPEDO_TYPE = 'torpedoGun';
export const BOMB_TYPE = 'bombGun';
export const BOOSTER_TYPE = 'boosterGun';
export const CONTAINER_TYPE = 'container';
export const EXTFUELTANK_TYPE = 'fuelTankGun';

export const CANNON_NAME = 'cannon';
export const ROCKET_NAME = 'rocket';
export const TORPEDO_NAME = 'torpedo';
export const BOMB_NAME = 'bomb';
export const BOOSTER_NAME = 'payload';
export const CONTAINER_NAME = 'container';
export const EXTFUELTANK_NAME = 'payload';

// Keyed by "WIDTHxHEIGHT" since JS objects cannot key on tuples.
export const THERMAL_VISION_GENERATIONS = {
  '500x300': 'GEN1',
  '800x600': 'GEN2',
  '1024x768': 'GEN2+',
  '1200x800': 'GEN3',
  '1920x1080': 'GEN3+',
};

export const IR_VISION_GENERATIONS = {
  '800x600': 'GEN1',
  '1024x768': 'GEN2',
  '1200x800': 'GEN2+',
  '1600x1200': 'GEN3',
  '1920x1080': 'GEN3+',
};

export const BATTLE_RATINGS = [1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0, 4.3, 4.7, 5.0, 5.3, 5.7, 6.0, 6.3, 6.7, 7.0, 7.3, 7.7, 8.0, 8.3, 8.7, 9.0, 9.3, 9.7, 10.0, 10.3, 10.7, 11.0, 11.3, 11.7, 12.0, 12.3, 12.7, 13.0, 13.3, 13.7, 14.0, 14.3, 14.7, 15.0];

export const GROUND_TYPES = new Set(['light_tank', 'medium_tank', 'heavy_tank', 'tank_destroyer', 'spaa']);
export const AIR_TYPES = new Set(['fighter', 'assault', 'bomber', 'helicopter']);
export const SEA_TYPES = new Set(['destroyer', 'submarine_chaser', 'cruiser', 'battleship', 'gun_boat', 'torpedo_boat', 'torpedo_gun_boat', 'naval_ferry_barge']);

export const AIR_TYPES2 = new Set(['attack_helicopter', 'utility_helicopter', 'fighter', 'assault', 'bomber']);
export const GROUND_TYPES2 = new Set(['tank', 'light_tank', 'medium_tank', 'heavy_tank', 'tank_destroyer', 'spaa', 'lbv', 'mbv', 'hbv', 'exoskeleton']);
export const SEA_TYPES2 = new Set(['ship', 'destroyer', 'light_cruiser', 'boat', 'heavy_boat', 'barge', 'frigate', 'heavy_cruiser', 'battlecruiser', 'battleship', 'submarine']);

export const AIR_CLASSES = ['exp_fighter', 'exp_bomber', 'exp_assault', 'exp_helicopter'];
export const GROUND_CLASSES = ['exp_tank', 'exp_tank_destroyer', 'exp_SPAA', 'exp_heavy_tank'];
export const SEA_CLASSES = ['exp_cruiser', 'exp_destroyer', 'exp_gun_boat', 'exp_torpedo_boat', 'exp_submarine_chaser', 'exp_torpedo_gun_boat', 'exp_naval_ferry_barge'];

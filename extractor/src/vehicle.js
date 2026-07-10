// Port of utils/__init__.py — the vehicle-building pipeline.
//
// Fidelity notes:
//  * Any thrown error while building a vehicle is caught by the caller
//    (processVehicle in main.js), which drops that vehicle — same as the Python
//    try/except in process_vehicle_async. Several code paths here intentionally
//    let missing keys/files throw for exactly that reason.
//  * Python `set` collections that used identity hashing (Weapon, Modification,
//    Preset) performed no dedup, so we use arrays. Ammo used content hashing +
//    name eq, which nets out to dedup-by-full-content — replicated in
//    getAmmosByWeapon. Python sets are unordered, so element order is not
//    contractual anyway.

import { data } from './constants.js';
import * as C from './constants.js';
import {
  myFetch,
  valueFromDict,
  dictHasKeyInsensitive,
  dictKeysToList,
  getVersion,
  properRound,
  groupAndIncrement,
  isSquadronVehicle,
  isVehicleOnMarketplace,
  isPack,
} from './util.js';
import {
  makeEngine,
  makeAerodynamics,
  makeNightVisionDevice,
  nvdIsAllNull,
  makeBallisticComputer,
  ballisticIsAllFalse,
  makeModification,
  makeWeapon,
  makeAmmo,
  makePreset,
  makeCustomizablePreset,
  makePylon,
  makeVehicle,
} from './classes.js';

// Localization accumulators — mirror of the module-level sets in
// update_localization.py, populated as a side effect of weapon/ammo parsing.
export const ALL_WEAPONS = new Set();
export const ALL_AMMOS = new Set();
export const ALL_AMMO_TYPES = new Set();
export const ALL_EXPLOSIVES = new Set();

function getVehicleFetchUrl(vehicleName, unitTypeUri = '/units/tankmodels') {
  return `${data.URL_VROMFS}gamedata${unitTypeUri}/${vehicleName.toLowerCase()}.blkx`;
}

function getGunsUrl(gunPath) {
  return `${data.URL_VROMFS}${gunPath.toLowerCase()}x`;
}

export function createVehicle(vName, vFetchPath) {
  const details = myFetch(getVehicleFetchUrl(vName, vFetchPath));

  const dataObj = createVehicleData(vName, details, vFetchPath, null);
  if (dataObj === null) {
    return null;
  }

  dataObj.has_customizable_weapons = 'WeaponSlots' in details;
  dataObj.weapons = createWeapons(vName, details, dataObj.has_customizable_weapons);
  dataObj.presets = createPresets(details, dataObj.has_customizable_weapons, dataObj.weapons.length > 0);
  dataObj.customizable_presets = dataObj.has_customizable_weapons
    ? createCustomizablePresets(details, dataObj.weapons.length > 0)
    : null;
  return dataObj;
}

function createVehicleData(vName, vDetails, vFetchPath, vehicleType) {
  const vehicleWiki = valueFromDict(vDetails, 'wiki', valueFromDict(vDetails, 'Wiki'));
  const vehicleData = valueFromDict(data.WPCOST, vName);
  const vehicleTags = valueFromDict(valueFromDict(data.UNIT_TAGS, vName), 'Shop');
  const vehiclePhys = valueFromDict(vDetails, 'VehiclePhys', valueFromDict(vDetails, 'ShipPhys'));

  if (!(vName in data.WPCOST) || (vehicleType !== null && valueFromDict(vehicleData, 'unitMoveType') !== vehicleType)) {
    console.error(`vName=${vName} is not in WPCOST vehicleType=${vehicleType} WPCOST_TYPE=${valueFromDict(vehicleData, 'unitMoveType')}`);
    return null;
  }

  const vehicle = makeVehicle();
  let country = valueFromDict(vehicleData, 'country');
  country = country !== null ? country.replace('country_', '').toLowerCase() : country;
  vehicle.country = country;
  vehicle.identifier = vName;

  const tags = valueFromDict(valueFromDict(data.UNIT_TAGS, vName), 'tags');
  // The Python condition `(x != "boat" or x != "ship")` is a tautology (always
  // true), so this is simply "every key starting with type_".
  let types = Object.keys(tags)
    .filter((x) => x.startsWith('type_'))
    .map((x) => x.replace('type_', '').toLowerCase());
  for (const t of types) {
    if (C.SEA_TYPES2.has(t)) { vehicle.vehicle_type = t; break; }
    else if (C.AIR_TYPES2.has(t)) { vehicle.vehicle_type = t; break; }
    else if (C.GROUND_TYPES2.has(t)) { vehicle.vehicle_type = t; break; }
  }
  types = types.filter((t) => t !== vehicle.vehicle_type);
  vehicle.vehicle_sub_types = types;

  vehicle.event = valueFromDict(vehicleData, 'event', null);
  vehicle.release_date = valueFromDict(valueFromDict(data.UNIT_TAGS, vName), 'releaseDate', null);
  if (vehicle.release_date !== null) vehicle.release_date = vehicle.release_date.replace(' 00:00:00', '');
  vehicle.version = getVersion();

  vehicle.era = valueFromDict(vehicleData, 'rank');
  vehicle.arcade_br = C.BATTLE_RATINGS[valueFromDict(vehicleData, 'economiceraArcade', valueFromDict(vehicleData, 'economicRankArcade', 1.0))];
  vehicle.realistic_br = C.BATTLE_RATINGS[valueFromDict(vehicleData, 'economiceraHistorical', valueFromDict(vehicleData, 'economicRankHistorical', 1.0))];
  vehicle.simulator_br = C.BATTLE_RATINGS[valueFromDict(vehicleData, 'economiceraSimulation', valueFromDict(vehicleData, 'economicRankSimulation', 1.0))];
  const economicRankTankHistorical = valueFromDict(vehicleData, 'economicRankTankHistorical');
  vehicle.realistic_ground_br = economicRankTankHistorical !== null ? C.BATTLE_RATINGS[economicRankTankHistorical] : vehicle.realistic_br;
  const economicRankSimulation = valueFromDict(vehicleData, 'economiceraSimulation', valueFromDict(vehicleData, 'economicRankSimulation', 1.0));
  vehicle.simulator_ground_br = economicRankSimulation !== null ? C.BATTLE_RATINGS[economicRankSimulation] : vehicle.simulator_br;

  vehicle.value = valueFromDict(vehicleData, 'value', 0);
  vehicle.req_exp = valueFromDict(vehicleData, 'reqExp', 0);
  vehicle.is_premium = valueFromDict(vehicleData, 'costGold') !== null;

  vehicle.squadron_vehicle = isSquadronVehicle(data.SHOP, data.WPCOST, vehicle.identifier, vehicle.country, vehicle.vehicle_type);
  vehicle.on_marketplace = isVehicleOnMarketplace(data.SHOP, vehicle.identifier, vehicle.country, vehicle.vehicle_type);
  vehicle.is_pack = (vehicle.on_marketplace || vehicle.squadron_vehicle || !vehicle.is_premium)
    ? false
    : isPack(data.SHOP, vehicle.identifier, vehicle.country, vehicle.vehicle_type);
  vehicle.ge_cost = valueFromDict(vehicleData, 'costGold', 0);
  vehicle.crew_total_count = valueFromDict(vehicleData, 'crewTotalCount', 0);
  vehicle.hull_armor = valueFromDict(vehicleTags, 'armorThicknessHull', []);
  vehicle.turret_armor = valueFromDict(vehicleTags, 'armorThicknessTurret', []);

  const vehiclePhysMass = valueFromDict(vehiclePhys, 'Mass', valueFromDict(vehiclePhys, 'mass'));
  if (vehiclePhysMass !== null) {
    const emptyMass = valueFromDict(vehiclePhysMass, 'Empty', 0);
    const fuelMass = valueFromDict(vehiclePhysMass, 'Fuel', 0);
    vehicle.mass = Math.trunc(emptyMass + fuelMass);
  } else {
    const fmPath = valueFromDict(vDetails, 'fmFile');
    const fmKey = fmPath ? fmPath.replace('fm/', '').replace('.blk', '') : vName;
    const flightModel = myFetch(getVehicleFetchUrl(fmKey, C.VEHICLE_FETCH_URI.air_fm));

    const massObject = valueFromDict(flightModel, 'Mass', {});
    const emptyMass = valueFromDict(massObject, 'EmptyMass', 0);
    const fuelMass = valueFromDict(massObject, 'MaxFuelMass0', 0);
    const oilMass = valueFromDict(massObject, 'OilMass', 0);
    vehicle.mass = Math.trunc(emptyMass + fuelMass + oilMass);
  }

  vehicle.train1_cost = valueFromDict(vehicleData, 'trainCost', 0);
  vehicle.train2_cost = valueFromDict(vehicleData, 'train2Cost', 0);
  vehicle.train3_cost_gold = valueFromDict(vehicleData, 'train3Cost_gold', 0);
  vehicle.train3_cost_exp = valueFromDict(vehicleData, 'train3Cost_exp', 0);
  vehicle.sl_mul_arcade = valueFromDict(vehicleData, 'rewardMulArcade', 0.0);
  vehicle.sl_mul_realistic = valueFromDict(vehicleData, 'rewardMulHistorical', 0.0);
  vehicle.sl_mul_simulator = valueFromDict(vehicleData, 'rewardMulSimulation', 0.0);
  vehicle.exp_mul = valueFromDict(vehicleData, 'expMul', 0.0);
  vehicle.repair_time_arcade = valueFromDict(vehicleData, 'repairTimeHrsArcade', 0);
  vehicle.repair_time_realistic = valueFromDict(vehicleData, 'repairTimeHrsHistorical', 0);
  vehicle.repair_time_simulator = valueFromDict(vehicleData, 'repairTimeHrsSimulation', 0);
  vehicle.repair_time_no_crew_arcade = valueFromDict(vehicleData, 'repairTimeHrsNoCrewArcade', 0);
  vehicle.repair_time_no_crew_realistic = valueFromDict(vehicleData, 'repairTimeHrsNoCrewHistorical', 0);
  vehicle.repair_time_no_crew_simulator = valueFromDict(vehicleData, 'repairTimeHrsNoCrewSimulation', 0);
  vehicle.repair_cost_arcade = valueFromDict(vehicleData, 'repairCostArcade', 0);
  vehicle.repair_cost_realistic = valueFromDict(vehicleData, 'repairCostHistorical', 0);
  vehicle.repair_cost_simulator = valueFromDict(vehicleData, 'repairCostSimulation', 0);
  vehicle.repair_cost_per_min_arcade = valueFromDict(vehicleData, 'repairCostPerMinArcade', 0);
  vehicle.repair_cost_per_min_realistic = valueFromDict(vehicleData, 'repairCostPerMinHistorical', 0);
  vehicle.repair_cost_per_min_simulator = valueFromDict(vehicleData, 'repairCostPerMinSimulation', 0);
  vehicle.repair_cost_full_upgraded_arcade = valueFromDict(vehicleData, 'repairCostFullUpgradedArcade', 0);
  vehicle.repair_cost_full_upgraded_realistic = valueFromDict(vehicleData, 'repairCostFullUpgradedHistorical', 0);
  vehicle.repair_cost_full_upgraded_simulator = valueFromDict(vehicleData, 'repairCostFullUpgradedSimulation', 0);
  vehicle.required_vehicle = valueFromDict(vehicleData, 'reqAir', null);

  vehicle.engine = createVehicleDataEngine(vFetchPath, vehiclePhys, vehicleTags);
  vehicle.aerodynamics = C.AIR_TYPES.has(vehicle.vehicle_type) ? createVehicleDataAerodynamics(vehicleWiki, vehicleTags) : null;
  vehicle.modifications = createVehicleDataModifications(vehicleData);
  const nightVisionDevices = createVehicleNightVision(vDetails, vehicle.vehicle_type);
  vehicle.ir_devices = nightVisionDevices[0];
  vehicle.thermal_devices = nightVisionDevices[1];
  vehicle.ballistic_computer = createVehicleBallisticComputer(vDetails, vehicle.vehicle_type);
  return vehicle;
}

function createVehicleDataEngine(vFetchPath, vehiclePhys, vehicleTags) {
  const finalEngine = makeEngine();

  if (vFetchPath.includes('ships')) {
    const engine = valueFromDict(vehiclePhys, 'engines');
    const maxSpeed = valueFromDict(engine, 'maxSpeed', 0);
    const maxRevSpeed = valueFromDict(engine, 'maxRevSpeed', valueFromDict(engine, 'maxReverseSpeed', 0));
    finalEngine.max_speed_rb_sb = Math.floor(typeof maxSpeed === 'number' ? maxSpeed * 3.6 : maxSpeed[0] * 3.6);
    finalEngine.max_reverse_speed_rb_sb = Math.floor(typeof maxRevSpeed === 'number' ? maxRevSpeed * 3.6 : maxRevSpeed[0] * 3.6);
    finalEngine.max_speed_ab = properRound(finalEngine.max_speed_rb_sb * C.ENGINE_SPEED_AB_MUL_SHIP);
    finalEngine.max_reverse_speed_ab = properRound(finalEngine.max_reverse_speed_rb_sb * C.ENGINE_SPEED_AB_MUL_SHIP);
  } else if (vFetchPath.includes('flightmodels')) {
    finalEngine.max_speed_rb_sb = Math.floor(valueFromDict(vehicleTags, 'maxSpeed', 0) * 3.6);
    finalEngine.max_speed_ab = properRound(finalEngine.max_speed_rb_sb * C.ENGINE_SPEED_AB_MUL_AIR);
  } else if (vFetchPath.includes('tankmodels')) {
    const engine = valueFromDict(vehiclePhys, 'engine');
    const mechanics = valueFromDict(vehiclePhys, 'mechanics', valueFromDict(vehiclePhys, 'Mechanics'));
    const driveGearRadius = valueFromDict(mechanics, 'driveGearRadius', 0);
    const mainGearRatio = valueFromDict(mechanics, 'mainGearRatio', 0);
    const sideGearRatio = valueFromDict(mechanics, 'sideGearRatio', 0);
    const gears = valueFromDict(valueFromDict(mechanics, 'gearRatios'), 'ratio');
    finalEngine.max_rpm = valueFromDict(engine, 'maxRPM', 0);
    finalEngine.min_rpm = valueFromDict(engine, 'minRPM', 0);
    finalEngine.horse_power_rb_sb = Math.trunc(valueFromDict(engine, 'horsePowers', 0));
    finalEngine.horse_power_ab = properRound(finalEngine.horse_power_rb_sb * C.ENGINE_HP_AB_MUL_TANK);

    try {
      finalEngine.max_speed_rb_sb = Math.floor(((finalEngine.max_rpm * driveGearRadius) / (mainGearRatio * sideGearRatio * gears[gears.length - 1])) * 0.12 * 3.14);
      finalEngine.max_reverse_speed_rb_sb = Math.floor(((finalEngine.max_rpm * driveGearRadius) / (mainGearRatio * sideGearRatio * gears[0])) * 0.12 * 3.14);
    } catch {
      console.error(`Error while creating engine for ${vFetchPath}`);
      finalEngine.max_speed_rb_sb = 0;
      finalEngine.max_reverse_speed_rb_sb = 0;
    }
    // NaN guard: Python `floor(NaN)` raises (dropping the vehicle); JS Math.floor
    // yields NaN which JSON-serialises to null. Coerce back to the 0 fallback so
    // a malformed gearbox degrades gracefully rather than emitting null.
    if (!Number.isFinite(finalEngine.max_speed_rb_sb)) finalEngine.max_speed_rb_sb = 0;
    if (!Number.isFinite(finalEngine.max_reverse_speed_rb_sb)) finalEngine.max_reverse_speed_rb_sb = 0;

    finalEngine.max_speed_ab = Math.trunc(properRound(finalEngine.max_speed_rb_sb * C.ENGINE_SPEED_AB_MUL_TANK));
    finalEngine.max_reverse_speed_ab = Math.trunc(properRound(finalEngine.max_reverse_speed_rb_sb * C.ENGINE_SPEED_AB_MUL_TANK));
  }
  return finalEngine;
}

function createVehicleDataAerodynamics(vehicleWiki, vehicleTags) {
  const wiki = valueFromDict(vehicleWiki, 'general', valueFromDict(vehicleWiki, 'General'));
  const aerodynamics = makeAerodynamics();
  aerodynamics.length = valueFromDict(wiki, 'length', 0);
  aerodynamics.wingspan = valueFromDict(wiki, 'wingspan', 0);
  aerodynamics.wing_area = valueFromDict(wiki, 'wingArea', 0);
  aerodynamics.empty_weight = valueFromDict(wiki, 'emptyWeight', 0);
  aerodynamics.max_takeoff_weight = valueFromDict(wiki, 'maxTakeoffWeight', 0);
  aerodynamics.max_altitude = valueFromDict(vehicleTags, 'maxAltitude', 0);
  aerodynamics.turn_time = valueFromDict(vehicleTags, 'turnTime', 0);
  aerodynamics.runway_length_required = valueFromDict(vehicleTags, 'airfieldLen', 0);
  aerodynamics.max_speed_at_altitude = valueFromDict(vehicleTags, 'maxSpeedAlt', 0);
  return aerodynamics;
}

function createVehicleDataModifications(vehicleWpcost) {
  const modifications = vehicleWpcost.modifications;
  const finalModifications = [];
  for (const modName of Object.keys(modifications)) {
    const mod = modifications[modName];
    if (valueFromDict(mod, 'tier', 0) === 0) {
      continue;
    }
    const modification = makeModification();
    modification.name = modName;
    modification.tier = valueFromDict(mod, 'tier', 0);
    modification.req_exp = valueFromDict(mod, 'reqExp', 0);
    modification.ge_cost = valueFromDict(mod, 'openCostGold') === null
      ? valueFromDict(mod, 'costGold', 0)
      : valueFromDict(mod, 'openCostGold', 0);
    modification.required_modification = valueFromDict(mod, 'reqModification');
    modification.value = valueFromDict(mod, 'value', 0);
    modification.repair_coeff = valueFromDict(mod, 'repairCostCoef', 0);
    const modDict = valueFromDict(data.MODIFICATIONS, modification.name);
    if (modDict !== null) {
      modification.icon = valueFromDict(modDict, 'image');
      modification.mod_class = valueFromDict(modDict, 'modClass');
      if (modification.icon !== null && modification.icon !== undefined) {
        modification.icon = modification.icon
          .replace('#ui/gameuiskin#', 'modifications/')
          .replace('!', '')
          .replace('.avif', '');
        modification.icon += '.png';
      }
    }
    finalModifications.push(modification);
  }
  return finalModifications;
}

function createVehicleNightVision(vDetails, vehicleType) {
  const modifications = valueFromDict(vDetails, 'modifications');

  let nightVisionModification = null;
  if (C.SEA_TYPES2.has(vehicleType)) {
    return [null, null];
  } else if (C.AIR_TYPES2.has(vehicleType)) {
    if (modifications === null || !('heli_night_vision_system' in modifications)) {
      return [null, null];
    }
    nightVisionModification = valueFromDict(modifications, 'heli_night_vision_system');
  } else if (C.GROUND_TYPES2.has(vehicleType)) {
    if (modifications === null || !('night_vision_system' in modifications)) {
      return [null, null];
    }
    nightVisionModification = valueFromDict(modifications, 'night_vision_system');
  }

  let nightVisionDevices;
  if (nightVisionModification !== null) {
    const effects = valueFromDict(nightVisionModification, 'effects');
    nightVisionDevices = valueFromDict(effects, 'nightVision');
  } else {
    nightVisionDevices = valueFromDict(vDetails, 'night_vision');
  }
  let irDevices = makeNightVisionDevice();
  let thermalDevices = makeNightVisionDevice();

  const deviceMapping = {
    gunnerThermal: [thermalDevices, 'gunner_device', C.THERMAL_VISION_GENERATIONS],
    pilotThermal: [thermalDevices, 'pilot_device', C.THERMAL_VISION_GENERATIONS],
    sightTPodThermal: [thermalDevices, 'targeting_pod_device', C.THERMAL_VISION_GENERATIONS],
    sightThermal: [thermalDevices, 'sight_device', C.THERMAL_VISION_GENERATIONS],
    driverThermal: [thermalDevices, 'driver_device', C.THERMAL_VISION_GENERATIONS],
    commanderViewThermal: [thermalDevices, 'commander_device', C.THERMAL_VISION_GENERATIONS],
    gunnerIr: [irDevices, 'gunner_device', C.IR_VISION_GENERATIONS],
    pilotIr: [irDevices, 'pilot_device', C.IR_VISION_GENERATIONS],
    sightTPodIr: [irDevices, 'targeting_pod_device', C.IR_VISION_GENERATIONS],
    sightIr: [irDevices, 'sight_device', C.IR_VISION_GENERATIONS],
    driverIr: [irDevices, 'driver_device', C.IR_VISION_GENERATIONS],
    commanderViewIr: [irDevices, 'commander_device', C.IR_VISION_GENERATIONS],
  };

  // Iterating keys of a null object throws -> caller drops the vehicle (matches Python).
  for (const device of Object.keys(nightVisionDevices)) {
    if (device in deviceMapping) {
      const [deviceObj, attribute, generationDict] = deviceMapping[device];
      const resolution = valueFromDict(nightVisionDevices[device], 'resolution');
      const key = `${resolution[0]}x${resolution[1]}`;
      deviceObj[attribute] = Object.prototype.hasOwnProperty.call(generationDict, key) ? generationDict[key] : null;
    } else {
      return [null, null];
    }
  }

  if (nvdIsAllNull(irDevices) && nvdIsAllNull(thermalDevices)) return [null, null];
  if (nvdIsAllNull(irDevices)) irDevices = null;
  if (nvdIsAllNull(thermalDevices)) thermalDevices = null;

  return [irDevices, thermalDevices];
}

function createVehicleBallisticComputer(vDetails, vehicleType) {
  if (C.SEA_TYPES.has(vehicleType) || C.GROUND_TYPES.has(vehicleType)) {
    return null;
  }
  const bc = makeBallisticComputer();
  bc.gun_ccip = Boolean(valueFromDict(vDetails, 'haveCCIPForGun', false));
  bc.turret_ccip = Boolean(valueFromDict(vDetails, 'haveCCIPForTurret', false));
  bc.bombs_ccip = Boolean(valueFromDict(vDetails, 'haveCCIPForBombs', false));
  bc.rocket_ccip = Boolean(valueFromDict(vDetails, 'haveCCIPForRocket', false));
  bc.gun_ccrp = Boolean(valueFromDict(vDetails, 'haveCCRPForGun', false));
  bc.turret_ccrp = Boolean(valueFromDict(vDetails, 'haveCCRPForTurret', false));
  bc.bombs_ccrp = Boolean(valueFromDict(vDetails, 'haveCCRPForBombs', false));
  bc.rocket_ccrp = Boolean(valueFromDict(vDetails, 'haveCCRPForRocket', false));

  if (ballisticIsAllFalse(bc)) return null;
  return bc;
}

function createWeapons(vName, vDetails, customizable = false) {
  const finalWeapons = [];
  const finalPresets = [];

  if (customizable) {
    const commonWeapons = valueFromDict(vDetails, 'commonWeapons');
    if (commonWeapons !== null && typeof commonWeapons === 'object' && Object.keys(commonWeapons).length === 0) {
      return finalWeapons;
    }
    const defaultWeapons = valueFromDict(valueFromDict(vDetails, 'WeaponSlots'), 'WeaponSlot', []);
    if (defaultWeapons.length === 0) return finalWeapons;
    const weaponPreset = valueFromDict(defaultWeapons, 'WeaponPreset', []);
    if (Array.isArray(weaponPreset)) {
      for (const gun of weaponPreset) {
        const preset = makePreset();
        preset.name = gun.name;
        if (Array.isArray(valueFromDict(gun, 'Weapon'))) {
          for (const gunPart of valueFromDict(gun, 'Weapon')) {
            if (!gunPart.blk.includes('dummy')) {
              preset.weapons.push(createWeaponDetails(gunPart.blk));
            }
          }
        }
        finalPresets.push(preset);
      }
    } else if (weaponPreset !== null && typeof weaponPreset === 'object') {
      // Vehicles that can mount only one weapon (F4U-4)
      const preset = makePreset();
      preset.name = weaponPreset.name;
      if (Array.isArray(weaponPreset.Weapon)) {
        for (const gun of weaponPreset.Weapon) {
          if (!gun.blk.includes('dummy')) {
            preset.weapons.push(createWeaponDetails(gun.blk));
          }
        }
      }
      preset.weapons = groupAndIncrement(preset.weapons, 'name');
      finalPresets.push(preset);
    }
    return finalPresets;
  } else {
    let vehicleFileWeapons = valueFromDict(valueFromDict(vDetails, 'commonWeapons'), 'Weapon', []);
    vehicleFileWeapons = (vehicleFileWeapons !== null && !Array.isArray(vehicleFileWeapons) && typeof vehicleFileWeapons === 'object')
      ? [vehicleFileWeapons]
      : vehicleFileWeapons;

    for (const weapon of vehicleFileWeapons) {
      let weaponPath = valueFromDict(weapon, 'blk');
      if (weaponPath === null) {
        console.warn(`${vName} weapon weapon_path not exist`);
        continue;
      }
      weaponPath = weaponPath.endsWith('.blk') ? weaponPath : `${weaponPath}.blk`;
      if (weaponPath.endsWith('dummy_weapon.blk')) {
        continue;
      }
      const weaponDetails = createWeaponDetails(weaponPath);
      finalWeapons.push(weaponDetails);
    }

    return groupAndIncrement(finalWeapons, 'name');
  }
}

function createWeaponDetails(weaponPath, count = 1) {
  if (!weaponPath.endsWith('.blk')) {
    weaponPath += '.blk';
  }

  const weaponBlkx = myFetch(getGunsUrl(weaponPath));

  const nameMatch = weaponPath.match(/.*\/(.*).blk/);
  const name = nameMatch[1];

  const weaponType = valueFromDict(weaponBlkx, 'weaponType');

  const isRocket = valueFromDict(weaponBlkx, C.ROCKET_NAME) || dictHasKeyInsensitive(weaponBlkx, C.ROCKET_TYPE) || valueFromDict(weaponBlkx, C.ROCKET_TYPE);
  const isCannon = valueFromDict(weaponBlkx, C.CANNON_NAME) || dictHasKeyInsensitive(weaponBlkx, C.CANNON_TYPE) || valueFromDict(weaponBlkx, C.CANNON_TYPE) || weaponType === -1 || weaponType === 1 || weaponType === 3;
  const isTorpedo = valueFromDict(weaponBlkx, C.TORPEDO_NAME) || dictHasKeyInsensitive(weaponBlkx, C.TORPEDO_TYPE) || valueFromDict(weaponBlkx, C.TORPEDO_TYPE) || weaponType === 1;
  const isBomb = valueFromDict(weaponBlkx, C.BOMB_NAME) || dictHasKeyInsensitive(weaponBlkx, C.BOMB_TYPE) || valueFromDict(weaponBlkx, C.BOMB_TYPE);
  const isBooster = valueFromDict(weaponBlkx, C.BOOSTER_NAME) || dictHasKeyInsensitive(weaponBlkx, C.BOOSTER_TYPE) || valueFromDict(weaponBlkx, C.BOOSTER_TYPE);
  const isContainer = valueFromDict(weaponBlkx, C.CONTAINER_NAME) || dictHasKeyInsensitive(weaponBlkx, C.CONTAINER_TYPE) || valueFromDict(weaponBlkx, C.CONTAINER_TYPE);
  const isExtfueltank = valueFromDict(weaponBlkx, C.EXTFUELTANK_NAME) || dictHasKeyInsensitive(weaponBlkx, C.EXTFUELTANK_TYPE) || valueFromDict(weaponBlkx, C.EXTFUELTANK_TYPE);

  const valid = (weaponType !== null && weaponType !== undefined) || isRocket || isTorpedo || isCannon || isBomb || isBooster || isContainer || isExtfueltank;
  if (!valid) {
    console.error(`The weapon ${name} - type is missing ${getGunsUrl(weaponPath)} weapon_type=${weaponType}\tis_rocket=${isRocket}\tis_cannon=${isCannon}\tis_torpedo=${isTorpedo}\tIS_BOMB=${isBomb}\tis_container=${isContainer}`);
    return undefined;
  }

  let finalAmmos = [];

  const allWeaponsKeys = dictKeysToList(weaponBlkx);
  if (isCannon) {
    finalAmmos = getAmmosByWeapon('bullet', weaponBlkx, allWeaponsKeys);
  } else if (isRocket) {
    finalAmmos = getAmmosByWeapon('rocket', weaponBlkx, allWeaponsKeys);
  } else if (isTorpedo) {
    finalAmmos = getAmmosByWeapon('torpedo', weaponBlkx, allWeaponsKeys);
  } else if (isBomb) {
    finalAmmos = getAmmosByWeapon('bomb', weaponBlkx, allWeaponsKeys);
  } else if (isBooster) {
    finalAmmos = getAmmosByWeapon('payload', weaponBlkx, allWeaponsKeys);
  } else if (isContainer) {
    return createWeaponDetails(weaponBlkx.blk, weaponBlkx.bullets);
  } else if (isExtfueltank) {
    finalAmmos = getAmmosByWeapon('payload', weaponBlkx, allWeaponsKeys);
  }

  const weapon = makeWeapon();
  weapon.name = name;
  weapon.weapon_type = isCannon ? C.CANNON_NAME
    : isRocket ? C.ROCKET_NAME
      : isTorpedo ? C.TORPEDO_NAME
        : isBomb ? C.BOMB_NAME
          : isBooster ? C.BOOSTER_NAME
            : C.CONTAINER_NAME;
  weapon.count = count;
  weapon.ammos = finalAmmos;
  ALL_WEAPONS.add(weapon.name);

  return weapon;
}

function getAmmosByWeapon(weaponType, allWeapons, allWeaponsKeys = []) {
  // Replicates Python set-of-Ammo dedup, which nets out to dedup by full content.
  const byContent = new Map();
  for (const key of allWeaponsKeys) {
    let rawAmmo = null;
    const keyValue = valueFromDict(allWeapons, key);

    if ((keyValue !== null && typeof keyValue === 'object') && key.toLowerCase() === weaponType.toLowerCase()) {
      rawAmmo = keyValue;
    } else if (keyValue !== null && !Array.isArray(keyValue) && typeof keyValue === 'object' && dictHasKeyInsensitive(keyValue, weaponType)) {
      rawAmmo = valueFromDict(keyValue, weaponType);
    }

    if (!rawAmmo) continue;

    const rawAmmoList = Array.isArray(rawAmmo) ? rawAmmo : [rawAmmo];
    for (const a of rawAmmoList) {
      const ammo = createAmmo(a);
      byContent.set(JSON.stringify(ammo), ammo);
    }
  }
  return [...byContent.values()];
}

function createAmmo(rawAmmo) {
  const explosiveType = valueFromDict(rawAmmo, 'explosiveType');
  const explosiveMass = valueFromDict(rawAmmo, 'explosiveMass');

  let name = valueFromDict(rawAmmo, 'bombName', valueFromDict(rawAmmo, 'bulletName'));
  let type = valueFromDict(rawAmmo, 'bombType', valueFromDict(rawAmmo, 'bulletType'));
  let mass = valueFromDict(rawAmmo, 'mass');
  mass = Array.isArray(mass) ? mass[0] : mass;
  // ship else generic
  const speed = valueFromDict(rawAmmo, 'maxSpeedInWater', valueFromDict(rawAmmo, 'speed', valueFromDict(rawAmmo, 'maxSpeed')));
  const caliber = valueFromDict(rawAmmo, 'caliber');
  // ship else generic
  const maxDistance = valueFromDict(rawAmmo, 'distToLive', valueFromDict(rawAmmo, 'maxDistance'));

  const out = makeAmmo();
  out.name = name;
  out.type = Array.isArray(type) ? type[0] : type;
  out.caliber = caliber;
  out.mass = mass;
  out.speed = speed;
  out.max_distance = maxDistance;
  out.explosive_type = explosiveType;
  out.explosive_mass = explosiveMass;

  // For localization
  if (out.name !== null && out.name !== undefined) {
    if (Array.isArray(out.name)) out.name = out.name[0];
    ALL_AMMOS.add(out.name);
  }
  if (out.explosive_type !== null && out.explosive_type !== undefined) {
    ALL_EXPLOSIVES.add(explosiveType);
  }
  if (out.type !== null && out.type !== undefined) {
    ALL_AMMO_TYPES.add(out.type);
  }
  return out;
}

function createPresets(vDetails, customizable, hasOffensiveWeapons) {
  const finalPresets = [];
  const weaponPresets = valueFromDict(vDetails, 'weapon_presets');
  const presets = valueFromDict(weaponPresets, 'preset');

  // Filters out default presets (no preset in-game). A dict here means a single
  // implicit preset -> return nothing.
  if (presets !== null && !Array.isArray(presets) && typeof presets === 'object') {
    return [];
  }
  if (customizable) {
    const weaponSlots = valueFromDict(vDetails, 'WeaponSlots');
    const weaponSlot = valueFromDict(weaponSlots, 'WeaponSlot');
    const SLOT_HASHMAP = {};
    for (const slot of weaponSlot) {
      SLOT_HASHMAP[slot.index] = weaponSlot.indexOf(slot);
    }

    for (const preset of (hasOffensiveWeapons ? presets.slice(1) : presets)) {
      const finalPreset = makePreset();
      finalPreset.name = preset.name;
      let presetDetails = valueFromDict(myFetch(getGunsUrl(preset.blk)), 'Weapon', []);
      if (presetDetails !== null && !Array.isArray(presetDetails) && typeof presetDetails === 'object') {
        presetDetails = [presetDetails];
      }
      for (const weaponOfPreset of presetDetails) {
        const pylonGuns = valueFromDict(weaponSlot[SLOT_HASHMAP[weaponOfPreset.slot]], 'WeaponPreset');

        if (pylonGuns !== null && !Array.isArray(pylonGuns) && typeof pylonGuns === 'object') {
          if (Array.isArray(pylonGuns.Weapon)) {
            for (const weapon of pylonGuns.Weapon) {
              if (!valueFromDict(weapon, 'blk', []).includes('dummy')) {
                finalPreset.weapons.push(createWeaponDetails(weapon.blk));
              }
            }
          } else {
            if (!valueFromDict(pylonGuns.Weapon, 'blk', []).includes('dummy')) {
              finalPreset.weapons.push(createWeaponDetails(pylonGuns.Weapon.blk));
            }
          }
        } else if (Array.isArray(pylonGuns)) {
          for (const weapon of pylonGuns) {
            if (weapon.name === weaponOfPreset.preset) {
              if ((weapon.Weapon !== null && !Array.isArray(weapon.Weapon) && typeof weapon.Weapon === 'object') && !valueFromDict(weapon.Weapon, 'blk').includes('dummy')) {
                finalPreset.weapons.push(createWeaponDetails(weapon.Weapon.blk));
              } else if (Array.isArray(weapon.Weapon)) {
                for (const w of weapon.Weapon) {
                  if (!valueFromDict(w, 'blk', []).includes('dummy')) {
                    finalPreset.weapons.push(createWeaponDetails(w.blk));
                  }
                }
              }
            }
          }
        } else {
          console.warn('Error while creating: ' + preset.name);
        }
      }
      finalPreset.weapons = groupAndIncrement(finalPreset.weapons, 'name');
      finalPresets.push(finalPreset);
    }
  } else {
    for (const presetRef of presets) {
      const blk = valueFromDict(presetRef, 'blk');
      const preset = myFetch(getGunsUrl(blk));

      if (!blk.toLowerCase().includes('_default') && !blk.toLowerCase().includes('empty') && preset.Weapon !== undefined && preset.Weapon !== null) {
        const finalPreset = makePreset();
        const nameMatch = blk.match(/.*\/(.*).blk/);
        finalPreset.name = nameMatch[1];
        const weapons = valueFromDict(preset, 'Weapon');

        if (!Array.isArray(weapons)) {
          if (!valueFromDict(preset.Weapon, 'blk', []).includes('dummy')) {
            finalPreset.weapons.push(createWeaponDetails(valueFromDict(preset.Weapon, 'blk')));
          }
        } else {
          for (const weapon of weapons) {
            // NB: faithful to the original — the guard checks preset.Weapon (the
            // whole list), not the individual `weapon`. Preserved intentionally.
            if (!valueFromDict(preset.Weapon, 'blk', []).includes('dummy')) {
              finalPreset.weapons.push(createWeaponDetails(valueFromDict(weapon, 'blk')));
            }
          }
        }

        finalPreset.weapons = groupAndIncrement(finalPreset.weapons, 'name');
        finalPresets.push(finalPreset);
      }
    }
  }

  return finalPresets;
}

function createCustomizablePresets(vDetails, hasOffensiveWeapons) {
  const weaponSlots = valueFromDict(vDetails, 'WeaponSlots');

  const customizablePreset = makeCustomizablePreset();
  customizablePreset.max_load = valueFromDict(weaponSlots, 'maxloadMass', 0);
  customizablePreset.max_load_left_wing = valueFromDict(weaponSlots, 'maxloadMassLeftConsoles', 0);
  customizablePreset.max_load_right_wing = valueFromDict(weaponSlots, 'maxloadMassRightConsoles', 0);
  customizablePreset.max_disbalance = valueFromDict(weaponSlots, 'maxDisbalance', 0);

  const weaponSlot = valueFromDict(weaponSlots, 'WeaponSlot');

  for (const slot of (hasOffensiveWeapons ? weaponSlot.slice(1) : weaponSlot)) {
    const pylon = makePylon();
    pylon.index = valueFromDict(slot, 'index', 1);
    pylon.used_for_disbalance = !valueFromDict(slot, 'notUseforDisbalanceCalculation', false);

    let availableWeapons = valueFromDict(slot, 'WeaponPreset', []);
    if (availableWeapons !== null && !Array.isArray(availableWeapons) && typeof availableWeapons === 'object') {
      availableWeapons = [availableWeapons];
    }

    for (const weaponObject of availableWeapons) {
      let weapons = valueFromDict(weaponObject, 'Weapon');
      if (weapons !== null && !Array.isArray(weapons) && typeof weapons === 'object') {
        weapons = [weapons];
      }
      if (weapons !== null && weapons !== undefined) {
        for (const weapon of weapons) {
          if (!weapon.blk.includes('dummy_weapon')) {
            pylon.selectable_weapons.push(createWeaponDetails(weapon.blk));
          }
        }
      }
    }

    pylon.selectable_weapons = groupAndIncrement(pylon.selectable_weapons, 'name');
    customizablePreset.pylons.push(pylon);
  }

  customizablePreset.pylons.sort((a, b) => a.index - b.index);
  return customizablePreset;
}

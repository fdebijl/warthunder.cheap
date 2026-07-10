// Port of the classes/ package.
//
// The Python classes were plain data holders with a toJson() method. In JS we
// represent them as plain objects keyed directly by their final JSON field
// names, built via factory functions that seed the same defaults. This removes
// the attribute-name/JSON-key divergence that BallisticComputer had in Python
// (has_gun_ccip -> "gun_ccip") — here the object already carries the JSON keys.

export function makeEngine() {
  return {
    horse_power_ab: 0,
    horse_power_rb_sb: 0,
    max_rpm: 0,
    min_rpm: 0,
    max_speed_ab: 0,
    max_reverse_speed_ab: 0,
    max_speed_rb_sb: 0,
    max_reverse_speed_rb_sb: 0,
  };
}

export function makeAerodynamics() {
  return {
    length: 0.0,
    wingspan: 0.0,
    wing_area: 0.0,
    empty_weight: 0,
    max_takeoff_weight: 0,
    max_altitude: 0,
    turn_time: 0,
    runway_length_required: 0,
    max_speed_at_altitude: 0,
  };
}

export function makeNightVisionDevice() {
  return {
    commander_device: null,
    driver_device: null,
    pilot_device: null,
    sight_device: null,
    targeting_pod_device: null,
    gunner_device: null,
  };
}

export function nvdIsAllNull(nvd) {
  return Object.values(nvd).every((v) => v === null);
}

export function makeBallisticComputer() {
  return {
    gun_ccip: false,
    turret_ccip: false,
    bombs_ccip: false,
    rocket_ccip: false,
    gun_ccrp: false,
    turret_ccrp: false,
    bombs_ccrp: false,
    rocket_ccrp: false,
  };
}

export function ballisticIsAllFalse(bc) {
  return !Object.values(bc).some(Boolean);
}

export function makeModification() {
  return {
    name: null,
    tier: 0,
    repair_coeff: 0.0,
    value: 0,
    req_exp: 0,
    ge_cost: 0,
    required_modification: null,
    mod_class: null,
    icon: null,
  };
}

export function makeWeapon() {
  return {
    name: null,
    weapon_type: null,
    count: 1,
    ammos: [],
  };
}

export function makeAmmo() {
  return {
    name: null,
    type: null,
    caliber: 0.0,
    mass: 0.0,
    speed: 0.0,
    max_distance: 0.0,
    explosive_type: null,
    explosive_mass: 0.0,
  };
}

export function makePreset() {
  return {
    name: null,
    weapons: [],
  };
}

export function makeCustomizablePreset() {
  return {
    max_load: 0,
    max_load_left_wing: 0,
    max_load_right_wing: 0,
    max_disbalance: 0,
    pylons: [],
  };
}

export function makePylon() {
  return {
    index: 1,
    used_for_disbalance: true,
    selectable_weapons: [],
  };
}

export function makeVehicle() {
  return {
    country: null,
    identifier: null,
    vehicle_type: null,
    vehicle_sub_types: [],
    event: null,
    release_date: null,
    version: null,
    era: 0,
    arcade_br: 1.0,
    realistic_br: 1.0,
    realistic_ground_br: 1.0,
    simulator_br: 1.0,
    simulator_ground_br: 1.0,
    value: 0,
    req_exp: 0,
    is_premium: false,
    is_pack: false,
    on_marketplace: false,
    squadron_vehicle: false,
    ge_cost: 0,
    crew_total_count: 0,
    visibility: 0,
    hull_armor: [],
    turret_armor: [],
    mass: 0,
    train1_cost: 0,
    train2_cost: 0,
    train3_cost_gold: 0,
    train3_cost_exp: 0,
    sl_mul_arcade: 0.0,
    sl_mul_realistic: 0.0,
    sl_mul_simulator: 0.0,
    exp_mul: 0.0,
    repair_time_arcade: 0.0,
    repair_time_realistic: 0.0,
    repair_time_simulator: 0.0,
    repair_time_no_crew_arcade: 0.0,
    repair_time_no_crew_realistic: 0.0,
    repair_time_no_crew_simulator: 0.0,
    repair_cost_arcade: 0,
    repair_cost_realistic: 0,
    repair_cost_simulator: 0,
    repair_cost_per_min_arcade: 0,
    repair_cost_per_min_realistic: 0,
    repair_cost_per_min_simulator: 0,
    repair_cost_full_upgraded_arcade: 0,
    repair_cost_full_upgraded_realistic: 0,
    repair_cost_full_upgraded_simulator: 0,
    required_vehicle: null,
    engine: null,
    modifications: [],
    ir_devices: null,
    thermal_devices: null,
    ballistic_computer: null,
    aerodynamics: null,
    weapons: [],
    has_customizable_weapons: false,
    presets: [],
    customizable_presets: null,
  };
}

// Mirror of Vehicle.toJson(): applies the null -> {} / [] conventions and fixes
// field ordering so output diffs cleanly against the Python tool.
export function vehicleToJson(v) {
  return {
    country: v.country,
    identifier: v.identifier,
    vehicle_type: v.vehicle_type,
    vehicle_sub_types: v.vehicle_sub_types,
    event: v.event,
    release_date: v.release_date,
    version: v.version,
    era: v.era,
    arcade_br: v.arcade_br,
    realistic_br: v.realistic_br,
    realistic_ground_br: v.realistic_ground_br,
    simulator_br: v.simulator_br,
    simulator_ground_br: v.simulator_ground_br,
    value: v.value,
    req_exp: v.req_exp,
    is_premium: v.is_premium,
    is_pack: v.is_pack,
    on_marketplace: v.on_marketplace,
    squadron_vehicle: v.squadron_vehicle,
    ge_cost: v.ge_cost,
    crew_total_count: v.crew_total_count,
    visibility: v.visibility,
    hull_armor: v.hull_armor,
    turret_armor: v.turret_armor,
    mass: v.mass,
    train1_cost: v.train1_cost,
    train2_cost: v.train2_cost,
    train3_cost_gold: v.train3_cost_gold,
    train3_cost_exp: v.train3_cost_exp,
    sl_mul_arcade: v.sl_mul_arcade,
    sl_mul_realistic: v.sl_mul_realistic,
    sl_mul_simulator: v.sl_mul_simulator,
    exp_mul: v.exp_mul,
    repair_time_arcade: v.repair_time_arcade,
    repair_time_realistic: v.repair_time_realistic,
    repair_time_simulator: v.repair_time_simulator,
    repair_time_no_crew_arcade: v.repair_time_no_crew_arcade,
    repair_time_no_crew_realistic: v.repair_time_no_crew_realistic,
    repair_time_no_crew_simulator: v.repair_time_no_crew_simulator,
    repair_cost_arcade: v.repair_cost_arcade,
    repair_cost_realistic: v.repair_cost_realistic,
    repair_cost_simulator: v.repair_cost_simulator,
    repair_cost_per_min_arcade: v.repair_cost_per_min_arcade,
    repair_cost_per_min_realistic: v.repair_cost_per_min_realistic,
    repair_cost_per_min_simulator: v.repair_cost_per_min_simulator,
    repair_cost_full_upgraded_arcade: v.repair_cost_full_upgraded_arcade,
    repair_cost_full_upgraded_realistic: v.repair_cost_full_upgraded_realistic,
    repair_cost_full_upgraded_simulator: v.repair_cost_full_upgraded_simulator,
    required_vehicle: v.required_vehicle,
    engine: v.engine,
    modifications: v.modifications === null ? [] : v.modifications,
    ir_devices: v.ir_devices !== null ? v.ir_devices : {},
    thermal_devices: v.thermal_devices !== null ? v.thermal_devices : {},
    ballistic_computer: v.ballistic_computer !== null ? v.ballistic_computer : {},
    aerodynamics: v.aerodynamics !== null ? v.aerodynamics : {},
    has_customizable_weapons: v.has_customizable_weapons,
    weapons: v.weapons === null ? [] : v.weapons,
    presets: v.presets === null ? [] : v.presets,
    customizable_presets: v.customizable_presets === null ? [] : v.customizable_presets,
  };
}

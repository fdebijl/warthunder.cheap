# WT-Vehicle-Data-Extract — Node.js port

A dependency-free (Node built-ins only) ESM port of [Sgambe33/WT-Vehicle-Data-Extract](https://github.com/Sgambe33/WT-Vehicle-Data-Extract),
which parses War Thunder vehicle data out of the [gszabi99 datamine](https://github.com/gszabi99/War-Thunder-Datamine).

## Run

```bash
node src/main.js --datamine /path/to/War-Thunder-Datamine [--out ./output] [--no-locales]
# or
DATAMINE_LOCATION=/path/to/War-Thunder-Datamine node src/main.js
```

Requires Node 20+. No `npm install` needed.

## Output (under `--out`, default `./output`)

- `nations/<country>/country_<country>_<air|ground|sea>.json` — input unit-id lists (`update_dataset`)
- `nations/<country>/<country>Final<Aircraft|Tank|Ship>s.json` — extracted vehicles per nation/type
- `vehicles.json` — **all vehicles in one array** (added by this port; the shape a downstream consumer wants)
- `locales/<iso>.json` — localized names for vehicles, modifications, weapons, ammo, explosives, ammo types (19 languages)

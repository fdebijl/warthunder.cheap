# CLAUDE.md

## Project Overview

Warthunder.cheap is an open-source tracker and archive for the War Thunder store. It tracks and displays price and discount history over time. Users can sign up for email alerts when items become discounted, become available again, or when new items are added. Alerts are dispatched via Mailgun. Authentication is JWT-based: the server generates a token and embeds it in email links (no passwords).

## Architecture

This is an npm workspaces monorepo with four packages, plus a standalone build-time tool:

- **`shared/`** — TypeScript library: domain models, MongoDB data layer (items, prices, alerts), the SQLite vehicle-data reader (`vehicledb/`), email template factory
- **`api/`** — Express 5 REST API: serves item/price data, manages alerts, handles token issuance and JWT auth
- **`scraper/`** — Puppeteer-based scraper: periodically crawls the War Thunder store, detects changes, triggers alerts, and matches store items to datamine vehicles (`src/matcher/`)
- **`website/`** — Vanilla JS/HTML/CSS frontend: item browser, price charts (Chart.js), alert management
- **`extractor/`** — standalone, dependency-free Node.js tool (NOT an npm workspace) that parses the [War Thunder datamine](https://github.com/gszabi99/War-Thunder-Datamine) into `output/vehicles.sqlite` (id → full vehicle JSON blob: battle ratings, specs, localized names). This DB is the reference data for the scraper's matcher and is served by the API. It's a Node.js port of [Sgambe33/WT-Vehicle-Data-Extract](https://github.com/Sgambe33/WT-Vehicle-Data-Extract); see [extractor/README.md](extractor/README.md).

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (api, scraper, shared), Vanilla JS (website) |
| Runtime | Node.js 24 |
| API | Express 5 |
| Database | MongoDB (via `mongodb` driver) |
| Scraping | Puppeteer |
| Auth | JWT (`jsonwebtoken`) — tokens embedded in email links |
| Email | Mailgun (`mailgun.js`) |
| Frontend | Vanilla JS, Chart.js, LazySizes |
| Build | tsc (production), tsx (development/watch) |
| Lint | ESLint 10 flat config (max 10 warnings) |
| Containers | Docker (multi-stage), Docker Compose + Traefik |

## Key Commands

```bash
# Lint all workspaces
npm run lint --workspace=shared
npm run lint --workspace=api
npm run lint --workspace=scraper
npm run lint --workspace=website

# Build TypeScript
npm run build --workspace=shared
npm run build --workspace=api
npm run build --workspace=scraper

# Dev (watch mode with tsx)
npm run start:watch --workspace=api
npm run start:watch --workspace=scraper

# Build the datamine vehicle DB (extractor/output/vehicles.sqlite).
# Clones the datamine (sparse) and runs the extractor. Needed by the API + scraper.
./.github/build-vehicle-db.sh
# Or run the extractor directly against an existing datamine checkout:
node extractor/src/main.js --datamine /path/to/War-Thunder-Datamine
```

The extractor has no dependencies and no build step — run it directly with `node`. It is not linted/built by the workspace commands.

There are no unit tests — CI validates via linting and TypeScript compilation.

## Important Files

- [api/src/index.ts](api/src/index.ts) — API entry point and route definitions
- [api/src/constants.ts](api/src/constants.ts) — Port, JWT secret, MongoDB URI, API versioning
- [scraper/src/index.ts](scraper/src/index.ts) — Scraper entry point; flags: `--wayback`, `--pricing`, `--imaging`
- [scraper/src/constants.ts](scraper/src/constants.ts) — Target store URLs, media path, headless mode
- [shared/src/db/](shared/src/db/) — All MongoDB operations (items, prices, alerts)
- [shared/src/vehicledb/](shared/src/vehicledb/) — Read-only SQLite vehicle-data access (`node:sqlite`); path from `VEHICLE_DB_PATH`
- [shared/src/mailfactory/](shared/src/mailfactory/) — Email templates (discount, available, newItem, token)
- [shared/src/domain/](shared/src/domain/) — TypeScript interfaces (Alert, Item, Price, Mail, VehicleRef, etc.)
- [extractor/src/main.js](extractor/src/main.js) — Extractor entry point; flags: `--datamine <path>`, `--out <dir>`, `--no-locales`
- [scraper/src/matcher/](scraper/src/matcher/) — Store-item → datamine-vehicle matcher (video-filename, fuzzy title, wiki-slug tiers)
- [.github/build-vehicle-db.sh](.github/build-vehicle-db.sh) — Clones the datamine (sparse) + runs the extractor; used by CI before docker builds
- [website/src/js/wtcheap.js](website/src/js/wtcheap.js) — Main frontend application logic
- [website/src/js/util/](website/src/js/util/) — Auth utilities, URL parameters, modals

## API Endpoints

```
GET  /api/v1/status
GET  /api/v1/items/current
GET  /api/v1/items/archived
GET  /api/v1/prices/:itemId
GET  /api/v1/vehicle/:datamineId — full datamine vehicle JSON blob (from vehicles.sqlite)
POST /api/v1/alerts              — requires email or JWT
GET  /api/v1/alerts              — requires JWT
DELETE /api/v1/alerts/:alertId   — requires JWT
POST /api/v1/tokens/request      — sends magic login link via email
GET  /api/v1/tokens/whoami       — returns email for current JWT
```

## Environment Variables

**API:**
```
MONGODB_URI=mongodb://localhost:27017/wtcheap
PORT=3000
JWT_SECRET=<secret>
MAILGUN_API_KEY=<key>
MAILGUN_DOMAIN=mail.warthunder.cheap
MAILGUN_SENDER=noreply@warthunder.cheap
VEHICLE_DB_PATH=./vehicles.sqlite   # SQLite vehicle DB; baked into the image in prod
```

**Scraper:**
```
MONGODB_URI=mongodb://localhost:27017/wtcheap
MAILGUN_API_KEY=<key>
MAILGUN_DOMAIN=mail.warthunder.cheap
MAILGUN_SENDER=noreply@warthunder.cheap
LAUNCH_HEADLESS=true
MEDIA_PATH=./media
VEHICLE_DB_PATH=./vehicles.sqlite   # SQLite vehicle DB used by the item matcher
HEARTBEAT_URL=           # optional monitoring webhook
```

## Coding Conventions

- All packages use ESM (`"type": "module"`)
- Shared library is the single source of truth for domain types and DB access — don't duplicate these in api or scraper
- Email templates live in `shared/src/mailfactory/`, one file per notification type
- The scraper runs on a cron schedule in Docker; the Dockerfile sets this up via `scraper/scraper-cron`
- Store item images are scraped to `website/src/media/` (one subdirectory per item)
- ESLint config: each TS workspace has `eslint.config.js` importing from `@fdebijl/eslint-config` (v2+, flat config). The shared rule set lives in that package — to add workspace-specific rules, spread the imported config array and append an override object
- `isWaybackRun && clog.log(...)` short-circuit pattern is intentional throughout the scraper; `allowShortCircuit: true` is set in `scraper/eslint.config.js` and `api/eslint.config.js`

## Frontend Architecture (website/)

- Entry point: [website/src/js/wtcheap.js](website/src/js/wtcheap.js) — orchestrates all renderers
- CSS components are imported via [website/src/css/components/index.css](website/src/css/components/index.css) — add new component CSS files here
- Renderers follow the pattern of a class with a `renderInto(selector)` or `appendTo(selector)` method
- `NavRenderer` owns all filtering and sorting state; `applyFilters()` composes nav filters + search query
- `StatsRenderer` uses the global `Chart` object (loaded via `<script src="/js/lib/chart.js">`) — charts must be destroyed before re-rendering (`_charts.forEach(c => c.destroy())`)
- Partner referral images live in `website/src/img/partners/{partner_slug}.webp`
- The custom partner dropdown uses `position:fixed` + `getBoundingClientRect()` to escape `overflow:hidden` on `<header>`
- `[hidden]` attribute is overridden by `display:flex` — always add `[hidden] { display:none }` when using hidden on flex children

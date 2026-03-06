# CLAUDE.md

## Project Overview

Warthunder.cheap is an open-source tracker and archive for the War Thunder store. It tracks and displays price and discount history over time. Users can sign up for email alerts when items become discounted, become available again, or when new items are added. Alerts are dispatched via Mailgun. Authentication is JWT-based: the server generates a token and embeds it in email links (no passwords).

## Architecture

This is an npm workspaces monorepo with four packages:

- **`shared/`** — TypeScript library: domain models, MongoDB data layer (items, prices, alerts), email template factory
- **`api/`** — Express 5 REST API: serves item/price data, manages alerts, handles token issuance and JWT auth
- **`scraper/`** — Puppeteer-based scraper: periodically crawls the War Thunder store, detects changes, triggers alerts
- **`website/`** — Vanilla JS/HTML/CSS frontend: item browser, price charts (Chart.js), alert management

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
| Lint | ESLint (max 10 warnings) |
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
```

There are no unit tests — CI validates via linting and TypeScript compilation.

## Important Files

- [api/src/index.ts](api/src/index.ts) — API entry point and route definitions
- [api/src/constants.ts](api/src/constants.ts) — Port, JWT secret, MongoDB URI, API versioning
- [scraper/src/index.ts](scraper/src/index.ts) — Scraper entry point; flags: `--wayback`, `--pricing`, `--imaging`
- [scraper/src/constants.ts](scraper/src/constants.ts) — Target store URLs, media path, headless mode
- [shared/src/db/](shared/src/db/) — All database operations (items, prices, alerts)
- [shared/src/mailfactory/](shared/src/mailfactory/) — Email templates (discount, available, newItem, token)
- [shared/src/domain/](shared/src/domain/) — TypeScript interfaces (Alert, Item, Price, Mail, etc.)
- [website/src/js/wtcheap.js](website/src/js/wtcheap.js) — Main frontend application logic
- [website/src/js/util/](website/src/js/util/) — Auth utilities, URL parameters, modals

## API Endpoints

```
GET  /api/v1/status
GET  /api/v1/items/current
GET  /api/v1/items/archived
GET  /api/v1/prices/:itemId
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
```

**Scraper:**
```
MONGODB_URI=mongodb://localhost:27017/wtcheap
MAILGUN_API_KEY=<key>
MAILGUN_DOMAIN=mail.warthunder.cheap
MAILGUN_SENDER=noreply@warthunder.cheap
LAUNCH_HEADLESS=true
MEDIA_PATH=./media
HEARTBEAT_URL=           # optional monitoring webhook
```

## Coding Conventions

- All packages use ESM (`"type": "module"`)
- Shared library is the single source of truth for domain types and DB access — don't duplicate these in api or scraper
- Email templates live in `shared/src/mailfactory/`, one file per notification type
- The scraper runs on a cron schedule in Docker; the Dockerfile sets this up via `scraper/scraper-cron`
- Store item images are scraped to `website/src/media/` (one subdirectory per item)

# [Warthunder.cheap](https://warthunder.cheap)

WarThunder.Cheap is a web application that tracks item prices, discounts, and availability in the War Thunder store. It allows users to sign up for alerts on specific items to be notified via email when:

- An item is discounted
- An item is back in stock
- New items are added

The system consists of three main components:

1. **Scraper:** Periodically scrapes the War Thunder store using puppeteer to update price and item information.
2. **API:** Exposes the scraped data and manages user alerts.
3. **Website:** The interface for browsing item data and managing alerts.

## Local Development

### Prerequisites

- Node.js 24
- MongoDB running locally on the default port (`27017`)
- npm >= 6

### Setup

```bash
# Install all workspace dependencies from the repo root
npm install
```

Create a `.env` file in both `api/` and `scraper/` as needed. All env vars have sensible defaults for local development — the only required ones for the API to start are the Mailgun vars (needed to dispatch alert emails). See the docker-compose template for a full list.

**`api/.env`**
```
MAILGUN_API_KEY=your_key
MAILGUN_DOMAIN=mail.example.com
MAILGUN_SENDER=noreply@example.com
```

**`scraper/.env`**
```
MAILGUN_API_KEY=your_key
MAILGUN_DOMAIN=mail.example.com
MAILGUN_SENDER=noreply@example.com
MEDIA_PATH=/path/to/warthunder.cheap/website/src/media
```

### Running each component

**Shared library** — compile first, as api and scraper depend on it:
```bash
npm run compile --workspace=shared
```

**API** — watch mode, recompiles on save:
```bash
npm run start:watch --workspace=api
# API will be available at http://localhost:3000/api/v1
```

**Scraper** — run once manually:
```bash
npm run start:watch --workspace=scraper
# Optional flags: --pricing (record prices to DB), --imaging (download item images), --wayback (scrape from Internet Archive)
```

**Website** — the frontend is plain HTML/JS with no build step. Serve `website/src/` with any static file server, for example:
```bash
npx serve website/src
# Or: python3 -m http.server --directory website/src 8080
```

The website reads `API_URL` from a generated `js/env.js` file (injected by the Docker entrypoint in production). For local development, either create `website/src/js/env.js` manually:
```js
export const API_URL = 'http://localhost:3000/api/v1';
```
or point your static server's proxy at the local API.

### Linting

```bash
npm run lint --workspace=shared
npm run lint --workspace=api
npm run lint --workspace=scraper
npm run lint --workspace=website
```

## License
This project is licensed under the MIT License. See the `LICENSE` file for more details.

## Acknowledgments
- [Mailgun](https://www.mailgun.com/) for email notifications.
- [Chart.js](https://www.chartjs.org/) for data visualization.
- [LazySizes.js](https://github.com/aFarkas/lazysizes) for image optimization.


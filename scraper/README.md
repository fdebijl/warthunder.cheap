# Warthunder.cheap Scraper

The scraper for Warthunder.cheap, designed to run on a schedule to keep the database up to date with the War Thunder store.

Flags:
```bash
  --wayback
        Scrape from wayback machine instead of the live store. Implies --pricing.
  --reverse
        [Only for --wayback] Scrape in reverse chronological order
  --pricing
        Store pricing information for each scraped item
  --imaging
        Store images for each scraped item
```

Default schedule:
- Pricing: `0 17 * * *`
  - Scrape the store every day at 17:00 (UTC) to get the latest pricing information.
- Availability/new items: `15,45 * * * *`
  - Scrape the store every hour at 15 and 45 minutes past the hour to get updates on item availability and new items.

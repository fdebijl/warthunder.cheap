# Store-item → datamine-vehicle matcher

Links War Thunder **store items** (scraped) to **datamine vehicle identifiers**
(from the `extractor`), so the site can show real vehicle data for a store pack.
Runs inside the scraper; the matched identifier(s) are written to each item in Mongo.

## Reference data

The matcher needs the datamine vehicle set, stored in the Mongo `vehicles`
collection (`VehicleRef`: identifier, country, type, premium/pack/marketplace/
squadron flags, and localized short+extended names across all locales).

The datamine (~7 GB) is not available at scrape time, so populating this is a
separate offline step:

```bash
# 1. Run the extractor against a datamine checkout (see extractor/README.md)
node ../extractor/src/main.js --datamine /path/to/War-Thunder-Datamine
# 2. Import its output into Mongo
node dist/matcher/importReferenceData.js            # or --extractor-output <dir>
```

Re-run both whenever the datamine updates (new vehicles / renames).

## How a match is made (precision-first: no match beats a wrong match)

For each current store item, in order — first confident hit wins:

1. **Tier A — video filenames** (`extractVideoIds`). Gaijin names promo videos
   after the vehicle: `wt_<id>_video`, `<id>_kit_3rank_video`, `<id>_sm_video`,
   `<id>_east_video`, or plain `<id>.webm`. We strip the wrappers and take the
   longest datamine id the stem equals/prefixes. This is near ground-truth, and
   because a bundle lists one video per vehicle it naturally returns **0..N** ids.
   Marketing-slug videos (`wt_king_tiger_video`) match nothing and are ignored.
2. **Tier C — fuzzy title** (`fuzzyMatch`). Nation-constrained (the store `nation`
   slug equals the datamine `country` 1:1) token-set match (Dice + containment +
   Jaro-Winkler) of the title against localized names. Accepts only near-exact, or
   above-threshold with a margin over the runner-up — so "King Tiger" / bare
   "Mustang" fall through rather than mis-match.
3. **Tier B — wiki link** (`resolveWikiIdentifier`, async). The store page's
   `wiki.warthunder.com/...` link redirects to `/unit/<slug>`, and `<slug>` **is**
   the datamine id. Captured during detail scraping (`Item.wikiHref`), used last
   because it costs a redirect fetch. Recovers nickname packs (King Tiger → the
   correct Tiger II Sla.16) that A and C can't.

Golden Eagles and Premium Account items are skipped (never vehicles).

## Output on each `Item`

- `datamineIds: string[]` — 0..N matched identifiers (packs may bundle several).
- `datamineMatchMethod: 'video' | 'wiki' | 'fuzzy' | null`.

Matches are **sticky**: a run that finds no match leaves the existing value
untouched, so a flaky scrape (media not captured) can't erase a good match.
Matches therefore accumulate/improve across runs.

## Files

- `normalize.ts` — homoglyph/diacritic/glyph folding, boilerplate stripping.
- `similarity.ts` — Dice, containment, Jaro-Winkler, blended name score.
- `matchItem.ts` — Tier A + C (`matchItem`) and the full async pipeline (`matchItemFull`).
- `resolveWiki.ts` — Tier B wiki-redirect resolution.
- `index.ts` — `buildMatchIndex` + `MatchIndex` type.
- `importReferenceData.ts` — one-off extractor-output → Mongo import.

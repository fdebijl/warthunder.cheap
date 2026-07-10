import { Clog, LOGLEVEL } from '@fdebijl/clog';
import { milliseconds } from '@fdebijl/pog';
import { Price, listItems, insertPrice, upsertItem, disconnect, loadVehicleRefs, vehicleDbAvailable } from 'wtcheap.shared';

import { getCurrentItems, deepCheckItem } from './scrapers/index.js';
import { buildMatchIndex, matchItemFull } from './matcher/index.js';
import { availableAlertNeeded, discountAlertNeeded, triggerAlertsForAvailable, triggerAlertsForDiscount, triggerAlertsForItems } from './alerting/index.js';
import { HEARTBEAT_URL, SHOP_2022_SELECTORS, TARGET_ROOTS } from './constants.js';
import { waybackMain } from './wayback.js';
import { ensureIndices } from './db/ensureIndices.js';
import { storeMedia } from './util/storeMedia.js';

export const clog = new Clog(LOGLEVEL.DEBUG);

export const isWaybackRun = process.argv.includes('--wayback');
export const isPricingRun = process.argv.includes('--pricing');
export const isImagingRun = process.argv.includes('--imaging');

const main = async () => {
  await ensureIndices();

  const currentItems = await getCurrentItems({ targetRoots: TARGET_ROOTS });
  const existingItems = await listItems();
  const notCurrentKnownItems = existingItems.filter((item) => !currentItems.some((currentItem) => currentItem.id === item.id));
  const newItems = currentItems.filter((item) => !existingItems.some((existingItem) => existingItem.id === item.id));

  clog.log(`Found ${currentItems.length} current items`);
  clog.log(`Found ${existingItems.length} existing items`);
  clog.log(`Found ${newItems.length} new items`);
  clog.log(`Found ${notCurrentKnownItems.length} known items that are no longer current`);

  // Load the datamine vehicle reference index once (from the SQLite DB baked into the image).
  const vehicleRefs = vehicleDbAvailable() ? loadVehicleRefs() : [];
  const matchIndex = vehicleRefs.length > 0 ? buildMatchIndex(vehicleRefs) : null;
  const refsById = new Map(vehicleRefs.map((ref) => [ref.identifier, ref]));
  if (!matchIndex) {
    clog.log('No datamine vehicle DB found (VEHICLE_DB_PATH) — skipping matching. Build it with the extractor.', LOGLEVEL.WARN);
  } else {
    clog.log(`Loaded ${vehicleRefs.length} datamine vehicles for matching`);
  }

  // Match a store item to datamine vehicle(s) and denormalize the identifier(s),
  // headline BR and broad class onto it. Only writes on a confident match, so a
  // no-match run leaves prior values untouched (a flaky scrape can't clobber a good
  // match). Applied to both current AND archived items — removed vehicles are
  // retained in the datamine, so archived packs (e.g. the Panther II) still resolve.
  const applyMatch = async (item: typeof currentItems[number]): Promise<void> => {
    if (!matchIndex) return;
    const match = await matchItemFull(item, matchIndex);
    if (!match) return;
    item.datamineIds = match.ids;
    item.datamineMatchMethod = match.method;
    const primary = refsById.get(match.ids[0]);
    item.br = primary?.realisticBr ?? null;
    item.vehicleClass = primary?.vehicleClass ?? null;
  };

  for (const item of currentItems) {
    const matchingItem = existingItems.find((existingItem) => existingItem.id === item.id);

    // If the item is now discounted but wasn't in the last scrape run, trigger an alert
    if (matchingItem && discountAlertNeeded(item, matchingItem)) {
      await triggerAlertsForDiscount(item, matchingItem);
    }

    // If the item is now available but wasn't in the last scrape run, trigger an alert
    if (matchingItem && availableAlertNeeded(item, matchingItem)) {
      await triggerAlertsForAvailable(item, matchingItem);
    }

    if (!matchingItem) {
      item.firstAvailableAt = new Date();

      if (isImagingRun) {
        await storeMedia(item);
      }
    }

    if (matchingItem && !matchingItem.firstAvailableAt) {
      item.firstAvailableAt = matchingItem.createdAt;
    }

    await applyMatch(item);

    item.source = 'live';
    await upsertItem(item);

    if (isPricingRun) {
      const price: Price = {
        itemId: item.id,
        date: new Date(),
        defaultPrice: item.defaultPrice,
        newPrice: item.newPrice,
        oldPrice: item.oldPrice,
        isDiscounted: item.isDiscounted,
        discountPercent: item.discountPercent
      };

      await insertPrice(price);
    }
  }

  for (const knownItem of notCurrentKnownItems) {
    const item = await deepCheckItem({ item: knownItem, selectors: SHOP_2022_SELECTORS });

    if (knownItem.buyable && !item.buyable) {
      item.lastAvailableAt = new Date(Date.now() - 12 * 60 * 60 * 1000);
    }

    // Archived/no-longer-current items still map to (retained) datamine vehicles.
    // deepCheckItem refreshes media/wikiHref where the page is reachable and
    // otherwise preserves the prior values, so the matcher has what it needs.
    await applyMatch(item);

    await upsertItem(item);
  }

  if (newItems.length > 0) {
    await triggerAlertsForItems(newItems);
  }

  clog.log(`Finished scraping run at ${new Date().toISOString()}`);

  if (HEARTBEAT_URL) {
    await fetch(HEARTBEAT_URL);
  }

  await disconnect();
  process.exit(0);
};

if (isWaybackRun) {
  waybackMain();
} else {
  clog.log(`Starting scraping run at ${new Date().toISOString()}, press CTRL+C to cancel`);
  await milliseconds(5_000);
  main();
}

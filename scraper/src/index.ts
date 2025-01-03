import { Clog, LOGLEVEL } from '@fdebijl/clog';
import { Price, listItems, insertPrice, upsertItem, } from 'wtcheap.shared';

import { getCurrentItems, deepCheckItem } from './scrapers/index.js';
import { availableAlertNeeded, discountAlertNeeded, triggerAlertsForAvailable, triggerAlertsForDiscount, triggerAlertsForItems } from './alerting/index.js';
import { HEARTBEAT_URL, SHOP_2022_SELECTORS, TARGET_ROOTS } from './constants.js';
import { waybackMain } from './wayback.js';
import { ensureIndices } from './db/ensureIndices.js';
import { storeMedia } from './util/storeMedia.js';
import { milliseconds } from '@fdebijl/pog';

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

    await upsertItem(item);
  }

  if (newItems.length > 0) {
    await triggerAlertsForItems(newItems);
  }

  clog.log(`Finished scraping run at ${new Date().toISOString()}`);

  if (HEARTBEAT_URL) {
    await fetch(HEARTBEAT_URL);
  }

  process.exit(0);
};

if (isWaybackRun) {
  waybackMain();
} else {
  clog.log(`Starting scraping run at ${new Date().toISOString()}, press CTRL+C to cancel`);
  await milliseconds(5_000);
  main();
}

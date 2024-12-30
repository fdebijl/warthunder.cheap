import fs from 'fs';
import puppeteer, { Page } from 'puppeteer';
import { LOGLEVEL } from '@fdebijl/clog';
import { findItem, insertPrice, Item, Price, upsertItem } from 'wtcheap.shared';
import { franc } from 'franc';

import { deepCheckItem, findBestMemento, getCurrentItems, isItemBuyable, matchSelectors } from './scrapers/index.js';
import { clog } from './index.js';
import { getArchiveSnapshots } from './scrapers/getArchiveSnapshots.js';
import { LAUNCH_HEADLESS, SHOP_2016_SELECTORS, SHOP_2021_SELECTORS, SHOP_2022_SELECTORS } from './constants.js';
import { containsNonLatinCharacters, enqueueStoreMedia } from './util/index.js';
import { milliseconds } from '@fdebijl/pog';

const WAYBACK_MACHINE_PAGE_TIMEOUT = 60_000;

const processUnseenItem = async (item: Item, page: Page): Promise<Item | null> => {
  const liveLink = `${item.href}`;
  const safeUrl = await findBestMemento(item.href, page.browser());

  if (!safeUrl) {
    clog.log(`Item ${item.id} "${item.title}" is a 404 on every snapshot, skipping`, LOGLEVEL.DEBUG);
    return null;
  }

  item.href = safeUrl.url;
  item.source = 'archive';

  try {
    await page.goto(item.href, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      // Prevent the Internet Archive's toolbar from interfering with the page
      const ippBase = document.querySelector('#wm-ipp-base');

      if (ippBase) {
        ippBase.remove();
      }
    });

    const selectors = await matchSelectors(page);

    switch (selectors) {
      case SHOP_2022_SELECTORS: {
        clog.log('Using 2022 selectors for detail page under scrape', LOGLEVEL.DEBUG);
        break;
      } case SHOP_2021_SELECTORS: {
        clog.log('Using 2021 selectors for detail page under scrape', LOGLEVEL.DEBUG);
        break;
      } case SHOP_2016_SELECTORS: {
        clog.log('Using 2016 selectors for detail page under scrape', LOGLEVEL.DEBUG);
        break;
      }
    }

    if (!selectors) {
      clog.log(`Could not ascertain selectors for item ${item.id} "${item.title}", skipping`, LOGLEVEL.DEBUG);
      return null;
    }

    const deepCheckedItem = await deepCheckItem({ item, selectors, page, skip404Check: true, skipPriceAssignment: true, skipNav: true });
    deepCheckedItem.buyable = await isItemBuyable(liveLink);
    deepCheckedItem.href = liveLink;

    if (containsNonLatinCharacters(deepCheckedItem.title!)) {
      clog.log(`Item ${item.id} "${item.title}" has a non-latin title, skipping`, LOGLEVEL.DEBUG);
      return null;
    }

    const descriptionLang = franc(deepCheckedItem.details?.description);
    if (descriptionLang !== 'eng') {
      clog.log(`Item ${item.id} "${item.title}" has a non-english description (${descriptionLang}), skipping`, LOGLEVEL.DEBUG);
      return null;
    }

    clog.log(`Upserting item ${deepCheckedItem.id} "${deepCheckedItem.title}" (Currently available?: ${deepCheckedItem.buyable})`, LOGLEVEL.DEBUG);
    await upsertItem(deepCheckedItem);

    const archivePrefix = safeUrl.url.match(/https:\/\/web.archive.org\/web\/\d{14}/)?.[0] as string;
    if (archivePrefix) {
      const prefix = archivePrefix + 'im_/';
      enqueueStoreMedia(item, prefix).catch(e => clog.log(`Error storing media for item ${item.id} "${item.title}": ${e}`, LOGLEVEL.WARN));
    }

    return deepCheckedItem;
  } catch (e) {
    clog.log(`Error during deep check of item ${item.id} "${item.title}" at ${item.href}: ${e}`, LOGLEVEL.ERROR);
    return null;
  }
};

const scrapeRoot = async (root: { url: string, datetime: Date }, seenItems: Item[]): Promise<Item[]> => {
  clog.log(`Scraping root ${root.url} (${root.datetime.toISOString()})`, LOGLEVEL.DEBUG);

  const items = await getCurrentItems({ targetRoots: [root.url], slowMode: true, ignoreDiscounts: false, skipDeepCheck: true });
  const browser = await puppeteer.launch({ headless: LAUNCH_HEADLESS, args: ['--no-sandbox'] });
  const page = await browser.pages().then((pages) => pages[0]);
  page.setDefaultNavigationTimeout(WAYBACK_MACHINE_PAGE_TIMEOUT);
  page.setDefaultTimeout(WAYBACK_MACHINE_PAGE_TIMEOUT);

  for (const item of items) {
    // Assume unbuyable since we're scraping the archive, normal scraping run will rectify this if false
    item.buyable = false;
    item.source = 'archive';

    // Backdate first available date if necessary
    const existingItem = await findItem(item.id);
    if (existingItem?.firstAvailableAt) {
      if (existingItem.firstAvailableAt.getTime() < root.datetime.getTime()) {
        item.firstAvailableAt = root.datetime;
      }
    } else {
      item.firstAvailableAt = root.datetime;
    }

    // We already upsert here so that the item is in the DB, even if there are no memento's for the details page
    await upsertItem(item);

    const archivePrefix = root.url.match(/https:\/\/web.archive.org\/web\/\d{14}/)?.[0] as string;
    if (archivePrefix) {
      const prefix = archivePrefix + 'im_/';
      enqueueStoreMedia(item, prefix).catch(e => clog.log(`Error storing media for item ${item.id} "${item.title}": ${e}`, LOGLEVEL.WARN));
    }

    const price: Price = {
      itemId: item.id,
      date: root.datetime,
      defaultPrice: item.defaultPrice,
      oldPrice: item.oldPrice,
      newPrice: item.newPrice,
      isDiscounted: item.isDiscounted,
      discountPercent: item.discountPercent,
    };

    await insertPrice(price);
  }

  const unseenItems = items.filter((item) => !seenItems.some((seenItem) => seenItem.id === item.id));
  const usableItems = [];

  for (const item of unseenItems) {
    try {
      clog.log(`Processing item ${item.id} "${item.title}"`, LOGLEVEL.DEBUG);

      const processedItem = await processUnseenItem(item, page);

      if (processedItem) {
        usableItems.push(processedItem);
      }
    } catch (e) {
      clog.log(`Error processing item ${item.id} "${item.title}": ${e}`, LOGLEVEL.ERROR);
    }
  }

  await browser.close();

  return usableItems;
};

/** Perform a scraping run against the Wayback Machine to backfill the database */
export const waybackMain = async () => {
  clog.log(`Starting Wayback Machine scraping run at ${new Date().toISOString()}`);

  const memento = await getArchiveSnapshots('https://store.gaijin.net/catalog.php?category=WarThunderPacks');
  const roots = memento.memento.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

  clog.log(`Found ${roots.length} mementos`);

  let index = 1;
  const seenItems = [];

  for (const root of roots) {
    clog.log(`Processing memento ${index}/${roots.length}`);
    const usableItemsInRoot = await scrapeRoot(root, seenItems);
    seenItems.push(...usableItemsInRoot);
    index++;
  }

  clog.log(`Finished Wayback Machine scraping run at ${new Date().toISOString()}`);
  process.exit(0);
};

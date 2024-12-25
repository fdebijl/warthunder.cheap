import puppeteer, { Page } from 'puppeteer';
import { LOGLEVEL } from '@fdebijl/clog';
import { Item, upsertItem } from 'wtcheap.shared';
import { franc} from 'franc';

import { deepCheckItem, findNon404Memento, getCurrentItems, isItemBuyable, matchSelectors } from './scrapers';
import { upsertItem } from './db';
import { Item } from './domain';
import { clog } from './index';
import { getArchiveSnapshots } from './scrapers/getArchiveSnapshots';

const WAYBACK_MACHINE_PAGE_TIMEOUT = 60_000;

const containsNonLatinCharacters = (input: string): boolean => {
  // eslint-disable-next-line no-control-regex
  const nonLatinRegex = /[^\u0000-\u007F\u0100-\u024F\s.,;:'"\-()[\]{}!?0-9/]/;

  return nonLatinRegex.test(input);
}

const validateMediaSources = async (media: string[]): Promise<string[]> => {
  const validatedMedia = [];

  for (const source of media) {
    let fixedSource = source;
    if (source.startsWith('/')) {
      fixedSource = `https://static-store.gaijin.net${source}`;
    }
    try {
      const response = await fetch(fixedSource, { method: 'HEAD' });
      if (response.ok) {
        validatedMedia.push(fixedSource);
      } else {
        clog.log(`Source ${fixedSource} returned ${response.status}, removing`, LOGLEVEL.DEBUG);
      }
    } catch (e) {
      clog.log(`Error fetching source ${fixedSource}: ${e}`, LOGLEVEL.ERROR);
    }
  }

  return validatedMedia;
};

const processUnseenItem = async (item: Item, page: Page): Promise<Item | null> => {
  const liveLink = `${item.href}`;
  const safeUrl = await findNon404Memento(item.href, page.browser());

  if (!safeUrl) {
    clog.log(`Item ${item.id} "${item.title}" is a 404 on every snapshot, skipping`, LOGLEVEL.DEBUG);
    return null;
  }

  item.href = safeUrl.url;
  item.source = 'archive';

  try {
    await page.goto(item.href, { waitUntil: 'networkidle2' });
    const selectors = await matchSelectors(page);

    if (!selectors) {
      clog.log(`Could not ascertain selectors for item ${item.id} "${item.title}", skipping`, LOGLEVEL.DEBUG);
      return null;
    }

    const deepCheckedItem = await deepCheckItem({ item, selectors, page, skip404Check: true, skipPriceAssignment: true });
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

    if (deepCheckedItem.details?.media) {
      const validatedMedia = await validateMediaSources(deepCheckedItem.details.media);
      deepCheckedItem.details.media = validatedMedia;
    }

    if (deepCheckedItem.poster) {
      const validatedPoster = await validateMediaSources([deepCheckedItem.poster]);

      if (validatedPoster.length > 0) {
        deepCheckedItem.poster = validatedPoster[0];
      } else {
        deepCheckedItem.poster = deepCheckedItem.details?.media?.find((source) => source.endsWith('.jpg') || source.endsWith('.png'));
      }
    }

    clog.log(`Upserting item ${deepCheckedItem.id} "${deepCheckedItem.title}" (Currently available?: ${deepCheckedItem.buyable})`, LOGLEVEL.DEBUG);
    await upsertItem(deepCheckedItem);

    return deepCheckedItem;
  } catch (e) {
    clog.log(`Error during deep check of item ${item.id} "${item.title}" at ${item.href}: ${e}`, LOGLEVEL.ERROR);
    return null;
  }
};

const scrapeRoot = async (root: { url: string, datetime: Date }, seenItems: Item[]): Promise<Item[]> => {
  clog.log(`Scraping root ${root.url} (${root.datetime.toISOString()})`, LOGLEVEL.DEBUG);

  const items = await getCurrentItems({ targetRoots: [root.url], slowMode: true, ignoreDiscounts: true, skipDeepCheck: true });
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'], defaultViewport: { width: 1280, height: 720 } });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(WAYBACK_MACHINE_PAGE_TIMEOUT);
  page.setDefaultTimeout(WAYBACK_MACHINE_PAGE_TIMEOUT);

  const unseenItems = items.filter((item) => !seenItems.some((seenItem) => seenItem.id === item.id));
  const usableItems = [];

  for (const item of unseenItems) {
    try {
      const processedItem = await processUnseenItem(item, page);
      if (processedItem) {
        usableItems.push(processedItem);
      }
    } catch (e) {
      clog.log(`Error processing item ${item.id} "${item.title}": ${e}`, LOGLEVEL.ERROR);
    }
  }

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
    clog.log(`Processing root ${index}/${roots.length}`);
    const usableItemsInRoot = await scrapeRoot(root, seenItems);
    seenItems.push(...usableItemsInRoot);
    index++;
  }

  clog.log(`Finished Wayback Machine scraping run at ${new Date().toISOString()}`);
  process.exit(0);
};

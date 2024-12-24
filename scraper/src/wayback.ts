import puppeteer from 'puppeteer';
import { LOGLEVEL } from '@fdebijl/clog';
import { Item, upsertItem } from 'wtcheap.shared';
import { franc} from 'franc';

import { deepCheckItem, getCurrentItems, isItemBuyable } from './scrapers';
import { clog } from './index';

// Shop with the current selectors, starting from September 2021
const TARGET_ROOTS_2022_SHOP = [
  // 'https://web.archive.org/web/20210929014545/https://store.gaijin.net/catalog.php?category=WarThunderPacks', Different selectors
  // 'https://web.archive.org/web/20220115162744/https://store.gaijin.net/catalog.php?category=WarThunderPacks', Different selectors
  // 'https://web.archive.org/web/20220314062014/https://store.gaijin.net/catalog.php?category=warthunderpacks', Different selectors
  'https://web.archive.org/web/20220429050443/https://store.gaijin.net/catalog.php?category=WarThunderPacks',
  'https://web.archive.org/web/20220605190411/https://store.gaijin.net/catalog.php?category=WarThunderPacks',
  'https://web.archive.org/web/20220905162138/https://store.gaijin.net/catalog.php?category=WarThunderPacks',
  'https://web.archive.org/web/20220929203024/https://store.gaijin.net/catalog.php?category=WarThunderPacks',
  'https://web.archive.org/web/20221007054640/https://store.gaijin.net/catalog.php?category=WarThunderPacks',
  'https://web.archive.org/web/20230106154507/https://store.gaijin.net/catalog.php?category=WarThunderPacks',
  'https://web.archive.org/web/20230222072312/https://store.gaijin.net/catalog.php?category=WarThunderPacks',
  'https://web.archive.org/web/20230222072312/https://store.gaijin.net/catalog.php?category=WarThunderPacks',
  'https://web.archive.org/web/20230422052906/https://store.gaijin.net/catalog.php?category=WarThunderPacks',
  'https://web.archive.org/web/20230608181607/https://store.gaijin.net/catalog.php?category=WarThunderPacks',
  'https://web.archive.org/web/20230808023956/https://store.gaijin.net/catalog.php?category=WarThunderPacks',
  'https://web.archive.org/web/20231019031035/https://store.gaijin.net/catalog.php?category=WarThunderPacks',
  'https://web.archive.org/web/20231125150904/https://store.gaijin.net/catalog.php?category=WarThunderPacks',
  'https://web.archive.org/web/20231202085228/https://store.gaijin.net/catalog.php?category=WarThunderPacks',
  'https://web.archive.org/web/20240217152806/https://store.gaijin.net/catalog.php?category=WarThunderPacks',
  'https://web.archive.org/web/20240907232645/https://store.gaijin.net/catalog.php?category=WarThunderPacks',
  'https://web.archive.org/web/20241002221359/https://store.gaijin.net/catalog.php?category=WarThunderPacks',
  'https://web.archive.org/web/20241116000410/https://store.gaijin.net/catalog.php?category=WarThunderPacks',
  'https://web.archive.org/web/20241211183851/https://store.gaijin.net/catalog.php?category=WarThunderPacks'
];

// TODO: Populate this with the shop URLs for the 2016-style shop
// TODO: add a way to switch the selector set between 2016 and 2021 shop
// TODO: add 2016 shop selectors
// Shop with the previous set of selectors, starting from 2016
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TARGET_ROOTS_2016_SHOP = [
];

const containsNonLatinCharacters = (input: string): boolean => {
  // eslint-disable-next-line no-control-regex
  const nonLatinRegex = /[^\u0000-\u007F\u0100-\u024F\s.,;:'"\-()[\]{}!?0-9/]/;

  return nonLatinRegex.test(input);
}

const scrapeRoot = async (root: string, seenItems: Item[]): Promise<Item[]> => {
  clog.log(`Scraping root ${root}`, LOGLEVEL.DEBUG);

  const items = await getCurrentItems({ targetRoots: [root], slowMode: true, ignoreDiscounts: true, skipDeepCheck: true });
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(90_000);
  page.setDefaultTimeout(90_000);

  const unseenItems = items.filter((item) => !seenItems.some((seenItem) => seenItem.id === item.id));
  const usableItems = [];

  for (const item of unseenItems) {
    // The href from getCurrenItems point to the live store, which will 404 for many items from the Wayback Machine,
    // so we have to rewrite the href to point to the archived version
    const archiveOrgPrefix = root.replace('/https://store.gaijin.net/catalog.php?category=WarThunderPacks', '');
    const liveLink = `${item.href}`;
    item.href = `${archiveOrgPrefix}/${item.href}`;
    item.source = 'archive';

    try {
      const deepCheckedItem = await deepCheckItem({ item, page, skip404Check: true, skipPriceAssignment: true });
      deepCheckedItem.buyable = await isItemBuyable(liveLink);
      deepCheckedItem.href = liveLink;

      // Prevent snapshots in the Wayback Machine in languages other than English from being used
      // Could be changed in the future to only unset the title and description, but keep all the other info
      if (containsNonLatinCharacters(deepCheckedItem.title!)) {
        clog.log(`Item ${item.id} "${item.title}" has a non-latin title, skipping`, LOGLEVEL.DEBUG);
        continue;
      }

      const descriptionlang = franc(deepCheckedItem.details?.description);

      if (descriptionlang !== 'eng') {
        clog.log(`Item ${item.id} "${item.title}" has a non-english description (${descriptionlang}), skipping`, LOGLEVEL.DEBUG);
        continue
      }

      clog.log(`Upserting item ${deepCheckedItem.id} "${deepCheckedItem.title}" (Currently available?: ${deepCheckedItem.buyable})`, LOGLEVEL.DEBUG);
      await upsertItem(deepCheckedItem);
      usableItems.push(deepCheckedItem);
    } catch (e) {
      clog.log(`Error while deep checking item ${item.id} "${item.title}": ${e}`, LOGLEVEL.ERROR);
    }
  }

  return usableItems;
}

/** Perform a scraping run against the Wayback Machine to backfill the database */
export const waybackMain = async () => {
  clog.log(`Starting Wayback Machine scraping run at ${new Date().toISOString()}`);

  const seenItems = [];

  for (const root of TARGET_ROOTS_2022_SHOP) {
    const usableItemsInRoot = await scrapeRoot(root, seenItems);
    seenItems.push(...usableItemsInRoot);
  }

  clog.log(`Finished Wayback Machine scraping run at ${new Date().toISOString()}`);
  process.exit(0);
};

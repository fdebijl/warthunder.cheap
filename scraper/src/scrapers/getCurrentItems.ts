import puppeteer from 'puppeteer';
import { milliseconds } from '@fdebijl/pog';
import { LOGLEVEL } from '@fdebijl/clog';
import { Item } from 'wtcheap.shared';

import { clog } from '../index';
import { SHOP_2022_SELECTORS, PERMA_SALE_ITEM_IDS } from '../constants';
import { Item } from '../domain';
import { deepCheckItem } from './deepCheckItem';
import { getItems } from '../db';
import { getItemsOnPage } from './getItemsOnPage';
import { matchSelectors } from './matchSelectors';

// TODO: Extend documentation for parameters
/** Use slowmode when on slow connections or when scraping the internet archive */
export const getCurrentItems = async ({ targetRoots, slowMode = false, ignoreDiscounts = false, skipDeepCheck = false }: { targetRoots: string[], slowMode?: boolean, ignoreDiscounts?: boolean, skipDeepCheck?: boolean}): Promise<Item[]> => {
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'], defaultViewport: { width: 1280, height: 720 } });
  const page = await browser.newPage();

  const items: Item[] = [];

  for (const targetRoot of targetRoots) {
    await page.goto(targetRoot, { timeout: slowMode ? 90_000 : 30_000 });

    if (slowMode) {
      await milliseconds(2000);
    }

    const category = (new URLSearchParams(targetRoot.split('?')[1]).get('category') || 'Other') as Item['category'];
    const selectors = await matchSelectors(page);

    let loopCount = 0;
    const maxLoops = 50;

    while (loopCount <= maxLoops) {
      loopCount++;

      clog.log(`Scraping ${category} page ${loopCount}`, LOGLEVEL.DEBUG);

      const itemsOnPage = await getItemsOnPage({ page, selectors, category, ignoreDiscounts });

      items.push(...itemsOnPage);

      clog.log(`Scraped ${itemsOnPage.length} items on this page, scrolling to bottom`, LOGLEVEL.DEBUG);

      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      clog.log('Waiting for next page button', LOGLEVEL.DEBUG);

      if (slowMode) {
        await milliseconds(2000);
      }

      try {
        await page.waitForSelector(SHOP_2022_SELECTORS.PAGE_NEXT, { timeout: slowMode ? 30_000 : 2_000 });
      } catch (e) {
        clog.log('No next page button found, stopping pagination', LOGLEVEL.DEBUG);
        break;
      }

      const nextPage = await page.$(SHOP_2022_SELECTORS.PAGE_NEXT);

      if (!nextPage) {
        break;
      }

      clog.log('Clicking next page button and waiting for navigation', LOGLEVEL.DEBUG);

      // Be gentle on Gaijin's servers
      await milliseconds(1000);
      await Promise.all([
        nextPage.click(),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: slowMode ? 90_000 : 30_000 }),
      ]).catch((error) => {
        if (slowMode) {
          clog.log('Waiting for navigation encountered a timeout, aborting pagination', LOGLEVEL.DEBUG);
        } else {
          throw error;
        }
      });
    }

    await milliseconds(slowMode ? 3000 : 1000);
  }

  if (skipDeepCheck) {
    await browser.close();
    return items;
  }

  for await (const item of items) {
    clog.log(`Deep checking ${item.title}`, LOGLEVEL.DEBUG);

    await fetch(item.href, { redirect: 'follow' }).then((response) => {
      if (response.ok) {
        item.resolvedHref = response.url;
      }
    });

    const selectors = await matchSelectors(page);
    const { details } = await deepCheckItem({ item, selectors, page, skip404Check: true });
    item.details = details;

    await milliseconds(slowMode ? 2000 : 500);
  }

  await browser.close();
  return items;
};

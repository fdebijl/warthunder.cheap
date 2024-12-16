import puppeteer from 'puppeteer';
import { milliseconds } from '@fdebijl/pog';
import { LOGLEVEL } from '@fdebijl/clog';

import { clog } from '../index';
import { SELECTORS, PERMA_SALE_ITEM_IDS } from '../constants';
import { Item } from '../domain';
import { deepCheckItem } from './deepCheckItem';

// TODO: Extend documentation for parameters
/** Use slowmode when on slow connections or when scraping the internet archive */
export const getCurrentItems = async ({ targetRoots, slowMode = false, ignoreDiscounts = false, skipDeepCheck = false }: { targetRoots: string[], slowMode?: boolean, ignoreDiscounts?: boolean, skipDeepCheck?: boolean}): Promise<Item[]> => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const items: Item[] = [];

  for (const targetRoot of targetRoots) {
    await page.goto(targetRoot, { timeout: slowMode ? 90_000 : 30_000 });

    if (slowMode) {
      await milliseconds(2000);
    }

    const category = (new URLSearchParams(targetRoot.split('?')[1]).get('category') || 'Other') as Item['category'];

    let loopCount = 0;
    const maxLoops = 50;

    while (loopCount <= maxLoops) {
      loopCount++;

      clog.log(`Scraping ${category} page ${loopCount}`, LOGLEVEL.DEBUG);

      // eslint-disable-next-line no-shadow -- Variables here get injected into the browser context so shadowing is not relevant
      const itemsOnPage = await page.evaluate((SELECTORS, PERMA_SALE_ITEM_IDS, category, ignoreDiscounts) => {
        const pageItems: Item[] = [];
        const itemEls = document.querySelectorAll(SELECTORS.ITEM);

        const stripCurrency = (price: string): number => {
          if (!price) {
            return 0;
          }

          return Number(price.replace(/[^0-9.]/g, '').trim());
        }

        for (const itemEl of itemEls) {
          const href = itemEl.querySelector<HTMLAnchorElement>(SELECTORS.ITEM__HREF)?.href;
          const id = href ? Number(new URLSearchParams(href.split('?')[1]).get('id')) : null;
          const poster = itemEl.querySelector<HTMLImageElement>(SELECTORS.ITEM__POSTER)?.dataset.src ?? null;
          const title = itemEl.querySelector<HTMLDivElement>(SELECTORS.ITEM__TITLE)?.textContent?.trim();
          const rank = itemEl.querySelector<HTMLDivElement>(SELECTORS.ITEM__RANK)?.textContent?.trim();
          const nation = itemEl.querySelector<HTMLDivElement>(SELECTORS.ITEM__NATION)?.classList[1].replace('flag_wt_', '');
          const description = Array.from(
            itemEl.querySelectorAll<HTMLLIElement>(SELECTORS.ITEM__DESCRIPTION)
          ).map((li) => li.textContent?.trim() ?? '').join(' ');
          const oldPrice = stripCurrency(itemEl.querySelector<HTMLSpanElement>(SELECTORS.ITEM__OLD_PRICE)?.textContent?.trim() as string);
          const newPrice = stripCurrency(itemEl.querySelector<HTMLSpanElement>(SELECTORS.ITEM__NEW_PRICE)?.textContent?.trim() as string);

          if (!id || !href) {
            continue;
          }

          if (ignoreDiscounts && oldPrice && newPrice) {
            const defaultPrice = newPrice;
            const isDiscounted = false;
            const discountPercent = 0;

            pageItems.push({ id, category, href, buyable: true, poster, title, rank, nation, description, defaultPrice, oldPrice, newPrice, isDiscounted, discountPercent });
          } else {
            const isPermaSale = PERMA_SALE_ITEM_IDS.includes(id);
            const defaultPrice = isPermaSale ? newPrice : stripCurrency(itemEl.querySelector<HTMLSpanElement>(SELECTORS.ITEM__DEFAULT_PRICE)?.textContent?.trim() as string);
            const isDiscounted = !!oldPrice && !!newPrice && oldPrice !== newPrice && !isPermaSale;
            const discountPercent = isDiscounted ? Math.round((1 - newPrice / oldPrice) * 100) : null;

            pageItems.push({ id, category, href, buyable: true, poster, title, rank, nation, description, defaultPrice, oldPrice, newPrice, isDiscounted, discountPercent });
          }
        }

        return pageItems;
      }, SELECTORS, PERMA_SALE_ITEM_IDS, category, ignoreDiscounts);

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
        await page.waitForSelector(SELECTORS.PAGE_NEXT, { timeout: slowMode ? 30_000 : 2_000 });
      } catch (e) {
        clog.log('No next page button found, stopping pagination', LOGLEVEL.DEBUG);
        break;
      }

      const nextPage = await page.$(SELECTORS.PAGE_NEXT);

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

    const { details } = await deepCheckItem({ item, page, skip404Check: true });
    item.details = details;

    await milliseconds(slowMode ? 2000 : 500);
  }

  await browser.close();
  return items;
};

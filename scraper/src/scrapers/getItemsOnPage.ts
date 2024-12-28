import { Page } from 'puppeteer';
import { LOGLEVEL } from '@fdebijl/clog';
import { Item, SelectorSet } from 'wtcheap.shared';

import { PERMA_SALE_ITEM_IDS, SHOP_2016_SELECTORS, SHOP_2021_SELECTORS, SHOP_2022_SELECTORS } from '../constants.js';
import { clog } from '../index.js';

export const getItemsOnPage = async ({ page, selectors, category, ignoreDiscounts }: { page: Page, selectors: SelectorSet, category: Item['category'], ignoreDiscounts: boolean }): Promise<Item[]> => {
  switch (selectors) {
    case SHOP_2022_SELECTORS: {
      clog.log('Using 2022 selectors for page under scrape', LOGLEVEL.DEBUG);
      return getItemsOnPage2022(page, selectors, category, ignoreDiscounts);
    } case SHOP_2021_SELECTORS: {
      clog.log('Using 2021 selectors for page under scrape', LOGLEVEL.DEBUG);
      return getItemsOnPage2021(page, selectors, category, ignoreDiscounts);
    } case SHOP_2016_SELECTORS: {
      clog.log('Using 2016 selectors for page under scrape', LOGLEVEL.DEBUG);
      return getItemsOnPage2016(page, selectors, category, ignoreDiscounts);
    } default: {
      throw new Error(`Unknown selectors: ${selectors}`);
    }
  }
}

const getItemsOnPage2022 = async (page: Page, selectors: SelectorSet, category: Item['category'], ignoreDiscounts: boolean): Promise<Item[]> => {
  // eslint-disable-next-line no-shadow -- Variables here get injected into the browser context so shadowing is not relevant
  const itemsOnPage = await page.evaluate((selectors, permaSaleItems, category, ignoreDiscounts) => {
    const pageItems: Item[] = [];
    const itemEls = document.querySelectorAll(selectors.ITEM);

    const stripCurrency = (price: string): number => {
      if (!price) {
        return 0;
      }

      return Number(price.replace(/[^0-9.]/g, '').trim());
    }

    for (const itemEl of itemEls) {
      const href = itemEl.querySelector<HTMLAnchorElement>(selectors.ITEM__HREF)?.href;
      const id = href ? Number(new URLSearchParams(href.split('?')[1]).get('id')) : null;
      const poster = itemEl.querySelector<HTMLImageElement>(selectors.ITEM__POSTER)?.dataset.src ?? null;
      const title = itemEl.querySelector<HTMLDivElement>(selectors.ITEM__TITLE)?.textContent?.trim();
      const rank = itemEl.querySelector<HTMLDivElement>(selectors.ITEM__RANK)?.textContent?.trim();
      const nation = itemEl.querySelector<HTMLDivElement>(selectors.ITEM__NATION)?.classList[1].replace('flag_wt_', '');
      const description = Array.from(
        itemEl.querySelectorAll<HTMLLIElement>(selectors.ITEM__DESCRIPTION!)
      ).map((li) => li.textContent?.trim() ?? '').join(' ');
      const oldPrice = stripCurrency(itemEl.querySelector<HTMLSpanElement>(selectors.ITEM__OLD_PRICE)?.textContent?.trim() as string);
      const newPrice = stripCurrency(itemEl.querySelector<HTMLSpanElement>(selectors.ITEM__NEW_PRICE)?.textContent?.trim() as string);

      if (!id || !href) {
        continue;
      }

      if (ignoreDiscounts && oldPrice && newPrice) {
        const defaultPrice = newPrice;
        const isDiscounted = false;
        const discountPercent = 0;

        pageItems.push({ id, category, href, buyable: true, poster, title, rank, nation, description, defaultPrice, oldPrice, newPrice, isDiscounted, discountPercent });
      } else {
        const isPermaSale = permaSaleItems.includes(id);
        const defaultPrice = isPermaSale ? newPrice : stripCurrency(itemEl.querySelector<HTMLSpanElement>(selectors.ITEM__DEFAULT_PRICE)?.textContent?.trim() as string);
        const isDiscounted = !!oldPrice && !!newPrice && oldPrice !== newPrice && !isPermaSale;
        const discountPercent = isDiscounted ? Math.round((1 - newPrice / oldPrice) * 100) : null;

        pageItems.push({ id, category, href, buyable: true, poster, title, rank, nation, description, defaultPrice, oldPrice, newPrice, isDiscounted, discountPercent });
      }
    }

    return pageItems;
  }, selectors, PERMA_SALE_ITEM_IDS, category, ignoreDiscounts);

  return itemsOnPage;
}

const getItemsOnPage2021 = async (page: Page, selectors: SelectorSet, category: Item['category'], ignoreDiscounts: boolean): Promise<Item[]> => {
  return getItemsOnPage2022(page, selectors, category, ignoreDiscounts);
}

const getItemsOnPage2016 = async (page: Page, selectors: SelectorSet, category: Item['category'], ignoreDiscounts: boolean): Promise<Item[]> => {
  // eslint-disable-next-line no-shadow -- Variables here get injected into the browser context so shadowing is not relevant
  const itemsOnPage = await page.evaluate((selectors, permaSaleItems, category, ignoreDiscounts) => {
    const pageItems: Item[] = [];
    const itemEls = document.querySelectorAll<HTMLAnchorElement>(selectors.ITEM);

    const stripCurrency = (price: string): number => {
      if (!price) {
        return 0;
      }

      return Number(price.replace(/[^0-9.]/g, '').trim());
    }

    for (const itemEl of itemEls) {
      let href = itemEl.getAttribute('href');
      const id = href ? Number(href.replace('#item_', '')) : null;
      href = `https://store.gaijin.net/story.php?id=${id}`;
      const poster = itemEl.querySelector<HTMLImageElement>(selectors.ITEM__POSTER)?.src ?? null;
      const title = itemEl.querySelector<HTMLDivElement>(selectors.ITEM__TITLE)?.textContent?.trim();
      // Rank and nation only show up starting around 2018, earlier packs have this info on the details page
      const rank = itemEl.querySelector<HTMLDivElement>(selectors.ITEM__RANK)?.textContent?.trim();
      const nation = itemEl.querySelector<HTMLDivElement>(selectors.ITEM__NATION)?.classList[1].replace('tag_country_wt_', '');
      const oldPrice = stripCurrency(itemEl.querySelector<HTMLSpanElement>(selectors.ITEM__OLD_PRICE)?.textContent?.trim() as string);
      const newPrice = stripCurrency(itemEl.querySelector<HTMLSpanElement>(selectors.ITEM__NEW_PRICE)?.textContent?.trim() as string);

      if (!id || !href) {
        continue;
      }

      if (ignoreDiscounts && oldPrice && newPrice) {
        const defaultPrice = oldPrice;
        const isDiscounted = false;
        const discountPercent = 0;

        pageItems.push({ id, category, href, buyable: true, poster, title, rank, nation, defaultPrice, oldPrice, newPrice, isDiscounted, discountPercent });
      } else {
        const isPermaSale = permaSaleItems.includes(id);
        const defaultPrice = isPermaSale ? newPrice : stripCurrency(itemEl.querySelector<HTMLSpanElement>(selectors.ITEM__DEFAULT_PRICE)?.textContent?.trim() as string);
        const isDiscounted = !!oldPrice && !!newPrice && oldPrice !== newPrice && !isPermaSale;
        const discountPercent = isDiscounted ? Math.round((1 - newPrice / oldPrice) * 100) : null;

        pageItems.push({ id, category, href, buyable: true, poster, title, rank, nation, defaultPrice, oldPrice, newPrice, isDiscounted, discountPercent });
      }
    }

    return pageItems;
  }, selectors, PERMA_SALE_ITEM_IDS, category, ignoreDiscounts);

  return itemsOnPage;
}

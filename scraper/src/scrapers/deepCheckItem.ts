import puppeteer, { Page } from 'puppeteer';
import { milliseconds } from '@fdebijl/pog';

import { Item } from '../domain';
import { PERMA_SALE_ITEM_IDS, SELECTORS } from '../constants';
import { clog } from '../index';
import { LOGLEVEL } from '@fdebijl/clog';
import { isItemBuyable } from './isItemBuyable';
import { time } from 'console';

export const deepCheckItem = async ({ item, page, skip404Check = false, skipPriceAssignment = false }: { item: Item, page?: Page, skip404Check?: boolean, skipPriceAssignment?: boolean }): Promise<Item> => {
  item = { ...item };

  if (!skip404Check) {
    const isAvailable = await isItemBuyable(item.href);

    if (!isAvailable) {
      clog.log(`Item ${item.id} (${item.title}) is no longer being sold`, LOGLEVEL.DEBUG);
      item.buyable = false;
      return item;
    }
  }

  if (!page) {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    page = await browser.newPage();
  }

  await page.goto(item.href, { waitUntil: 'networkidle2' });
  await page.waitForSelector(SELECTORS.PAGE__DESCRIPTION);

  // eslint-disable-next-line no-shadow -- Variables here get injected into the browser context so shadowing is not relevant
  const priceInfo = await page.evaluate((SELECTORS) => {
    const oldPriceEl = document.querySelector(SELECTORS.ITEM__OLD_PRICE);
    const newPriceEl = document.querySelector(SELECTORS.ITEM__NEW_PRICE);
    const defaultPriceEl = document.querySelector(SELECTORS.ITEM__DEFAULT_PRICE);
    const media = [...document.querySelectorAll<HTMLDivElement>(SELECTORS.PAGE__MEDIA)].map((el) => el.dataset.fullSizeMediaUrl!);
    const description = document.querySelector(SELECTORS.PAGE__DESCRIPTION)?.textContent?.trim();

    const stripCurrency = (price: string): number => {
      if (!price) {
        return 0;
      }

      return Number(price.replace(/[^0-9.]/g, '').trim());
    }

    return {
      oldPrice: stripCurrency(oldPriceEl?.textContent?.trim() as string),
      newPrice: stripCurrency(newPriceEl?.textContent?.trim() as string),
      defaultPrice: stripCurrency(defaultPriceEl?.textContent?.trim() as string),
      media,
      description
    };
  }, SELECTORS);

  const { oldPrice, newPrice, media, description } = priceInfo;
  const isPermaSale = PERMA_SALE_ITEM_IDS.includes(item.id);
  const defaultPrice = isPermaSale ? oldPrice : priceInfo.defaultPrice;
  const isDiscounted = !!oldPrice && !!newPrice && oldPrice !== newPrice && !isPermaSale;
  const discountPercent = isDiscounted ? Math.round((1 - newPrice / oldPrice) * 100) : null;

  if (!skipPriceAssignment) {
    item.oldPrice = oldPrice;
    item.newPrice = newPrice;
    item.defaultPrice = defaultPrice;
    item.isDiscounted = isDiscounted;
    item.discountPercent = discountPercent;
  }

  if (!item.details) {
    item.details = {};
  }

  item.details.media = media;
  item.details.description = description;

  return item;
}

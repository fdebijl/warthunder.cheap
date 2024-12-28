import puppeteer, { Page } from 'puppeteer';
import { Item, SelectorSet } from 'wtcheap.shared';
import { LOGLEVEL } from '@fdebijl/clog';
import { milliseconds } from '@fdebijl/pog';

import { PERMA_SALE_ITEM_IDS } from '../constants.js';
import { clog } from '../index.js';
import { isItemBuyable } from './isItemBuyable.js';
import { getDetailsOnPage } from './getDetailsOnPage.js';

export const deepCheckItem = async ({ item, selectors, page, skip404Check = false, skipPriceAssignment = false }: { item: Item, selectors: SelectorSet, page?: Page, skip404Check?: boolean, skipPriceAssignment?: boolean }): Promise<Item> => {
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

  // TODO: During wayback runs the page will already be on the right url, so we can skip this step
  await page.goto(item.href, { waitUntil: 'networkidle2' });

  await Promise.race([
    milliseconds(30_000 - 10).then(() => { throw new Error('Could not find description during wait before getDetailsOnPage') }),
    page.waitForSelector(selectors.PAGE__DESCRIPTION, { visible: false, timeout: 30_000 }),
    page.waitForSelector(selectors.PAGE__SHORT_DESCRIPTION ?? selectors.PAGE__DESCRIPTION, { visible: false, timeout: 30_000 })
  ]);

  const detailsInfo = await getDetailsOnPage({ page, selectors})

  const { oldPrice, newPrice, media, description } = detailsInfo;
  const isPermaSale = PERMA_SALE_ITEM_IDS.includes(item.id);
  const defaultPrice = isPermaSale ? oldPrice : detailsInfo.defaultPrice;
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

  if (detailsInfo.shortDescription && !item.description) {
    item.description = detailsInfo.shortDescription;
  }

  item.details.media = media;
  item.details.description = description;

  return item;
}

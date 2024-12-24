import { Page } from 'puppeteer';
import { SelectorSet } from '../domain';
import { SHOP_2022_SELECTORS, SHOP_2021_SELECTORS, SHOP_2016_SELECTORS } from '../constants';

export const matchSelectors = (page: Page): Promise<SelectorSet> => {
  return Promise.race([
    page.waitForSelector(SHOP_2022_SELECTORS.ITEM__HREF).then(() => SHOP_2022_SELECTORS),
    page.waitForSelector(SHOP_2021_SELECTORS.ITEM__HREF).then(() => SHOP_2021_SELECTORS),
    page.waitForSelector(SHOP_2016_SELECTORS.ITEM__HREF).then(() => SHOP_2016_SELECTORS),
  ]);
}

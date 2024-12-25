import { Page } from 'puppeteer';
import { SelectorSet } from '../domain';
import { SHOP_2022_SELECTORS, SHOP_2021_SELECTORS, SHOP_2016_SELECTORS } from '../constants';

const MATCH_TIMEOUT = 30_000;

export const matchSelectors = (page: Page): Promise<SelectorSet> => {
  return Promise.race([
    // Item pages
    page.waitForSelector(SHOP_2022_SELECTORS.ITEM__HREF, { timeout: MATCH_TIMEOUT }).then(() => SHOP_2022_SELECTORS),
    page.waitForSelector(SHOP_2021_SELECTORS.ITEM__HREF, { timeout: MATCH_TIMEOUT }).then(() => SHOP_2021_SELECTORS),
    page.waitForSelector(SHOP_2016_SELECTORS.ITEM__HREF, { timeout: MATCH_TIMEOUT }).then(() => SHOP_2016_SELECTORS),
    // Detail pages, 2022 and 2021 are equivalent here
    page.waitForSelector(SHOP_2022_SELECTORS.PAGE__DESCRIPTION, { timeout: MATCH_TIMEOUT }).then(() => SHOP_2022_SELECTORS),
    page.waitForSelector(SHOP_2016_SELECTORS.PAGE__SHORT_DESCRIPTION!, { timeout: MATCH_TIMEOUT }).then(() => SHOP_2016_SELECTORS),
  ]);
}

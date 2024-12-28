import { Page } from 'puppeteer';
import { SelectorSet } from 'wtcheap.shared';
import { milliseconds } from '@fdebijl/pog';

import { SHOP_2022_SELECTORS, SHOP_2021_SELECTORS, SHOP_2016_SELECTORS } from '../constants.js';

const MATCH_TIMEOUT = 30_000;

// TODO: Doesn't work on ultra bundle? i.e. 2016 shop
// TODO: Document this
export const matchSelectors = (page: Page): Promise<SelectorSet> => {
  return Promise.race([
    milliseconds(MATCH_TIMEOUT - 10).then(() => { throw new Error('Could not ascertain selector set') }),
    // Item pages
    page.waitForSelector(`pierce/${SHOP_2022_SELECTORS.ITEM__HREF}`, { timeout: MATCH_TIMEOUT }).then(() => SHOP_2022_SELECTORS),
    page.waitForSelector(`pierce/${SHOP_2021_SELECTORS.ITEM__HREF}`, { timeout: MATCH_TIMEOUT }).then(() => SHOP_2021_SELECTORS),
    page.waitForSelector(`pierce/${SHOP_2016_SELECTORS.ITEM__HREF}`, { timeout: MATCH_TIMEOUT }).then(() => SHOP_2016_SELECTORS),
    // Detail pages, 2022 and 2021 are equivalent here
    page.waitForSelector(`pierce/${SHOP_2022_SELECTORS.PAGE__DESCRIPTION}`, { timeout: MATCH_TIMEOUT }).then(() => SHOP_2022_SELECTORS),
    page.waitForSelector(`pierce/${SHOP_2016_SELECTORS.PAGE__SHORT_DESCRIPTION!}`, { timeout: MATCH_TIMEOUT }).then(() => SHOP_2016_SELECTORS),
  ]);
}

import { Page } from 'puppeteer';
import { SelectorSet } from 'wtcheap.shared';

import { SHOP_2016_SELECTORS, SHOP_2021_SELECTORS, SHOP_2022_SELECTORS } from '../constants.js';
import { clog } from '../index.js';
import { LOGLEVEL } from '@fdebijl/clog';

type DetailsInfo = {
  oldPrice: number;
  newPrice: number;
  defaultPrice: number;
  media: string[];
  description?: string;
  shortDescription?: string;
}

export const getDetailsOnPage = async ({ page, selectors }: { page: Page, selectors: SelectorSet }): Promise<DetailsInfo> => {
  switch (selectors) {
    case SHOP_2022_SELECTORS: {
      clog.log('Using 2022 selectors for detail page under scrape', LOGLEVEL.DEBUG);
      return getDetailsOnPage2022(page, selectors);
    } case SHOP_2021_SELECTORS: {
      clog.log('Using 2021 selectors for detail page under scrape', LOGLEVEL.DEBUG);
      return getDetailsOnPage2021(page, selectors);
    } case SHOP_2016_SELECTORS: {
      clog.log('Using 2016 selectors for detail page under scrape', LOGLEVEL.DEBUG);
      return getDetailsOnPage2016(page, selectors);
    } default: {
      throw new Error(`Unknown selectors: ${selectors}`);
    }
  }
}

const getDetailsOnPage2022 = async (page: Page, selectors: SelectorSet): Promise<DetailsInfo> => {
  const detailsInfo = await page.evaluate((SELECTORS) => {
    const oldPriceEl = document.querySelector(SELECTORS.ITEM__OLD_PRICE);
    const newPriceEl = document.querySelector(SELECTORS.ITEM__NEW_PRICE);
    const defaultPriceEl = document.querySelector(SELECTORS.ITEM__DEFAULT_PRICE);
    const media = [...document.querySelectorAll<HTMLDivElement>(SELECTORS.PAGE__MEDIA)].map((el) => el.dataset.fullSizeMediaUrl!);
    const description = document.querySelector(SELECTORS.PAGE__DESCRIPTION)?.textContent?.trim();
    const shortDescription = Array.from(
      document.querySelectorAll<HTMLLIElement>(SELECTORS.PAGE__SHORT_DESCRIPTION!)
    ).map((li) => li.textContent?.trim() ?? '').join(' ');

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
      description,
      shortDescription
    };
  }, selectors);

  return detailsInfo;
}

const getDetailsOnPage2021 = async (page: Page, selectors: SelectorSet): Promise<DetailsInfo> => {
  return getDetailsOnPage2022(page, selectors);
}

const getDetailsOnPage2016 = async (page: Page, selectors: SelectorSet): Promise<DetailsInfo> => {
  const detailsInfo = await page.evaluate((SELECTORS) => {
    const oldPriceEl = document.querySelector(SELECTORS.ITEM__OLD_PRICE);
    const newPriceEl = document.querySelector(SELECTORS.ITEM__NEW_PRICE);
    const defaultPriceEl = document.querySelector(SELECTORS.ITEM__DEFAULT_PRICE);
    const media = [...document.querySelectorAll<HTMLImageElement>(SELECTORS.PAGE__MEDIA)].map((el) => el.src);
    const description = document.querySelector(SELECTORS.PAGE__DESCRIPTION)?.textContent?.trim();
    const shortDescription = Array.from(
      document.querySelectorAll<HTMLLIElement>(SELECTORS.PAGE__SHORT_DESCRIPTION!)
    ).map((li) => li.textContent?.trim() ?? '').join(' ');

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
      description,
      shortDescription
    };
  }, selectors);

  return detailsInfo;
}

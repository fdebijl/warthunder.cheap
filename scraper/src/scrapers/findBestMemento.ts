import { Browser } from 'puppeteer';
import { LOGLEVEL } from '@fdebijl/clog';

import { getArchiveSnapshots } from './getArchiveSnapshots.js';
import { clog } from '../index.js';

type Root = { url: string; datetime: Date; };

export const findBestMemento = async ({ url, browser, targetDate }: { url: string, browser: Browser, targetDate?: Date }): Promise<Root | null> => {
  const mementos = await getArchiveSnapshots(url);

  if (mementos['memento'] === undefined) {
    clog.log(`No mementos found for ${url}`, LOGLEVEL.DEBUG);
    return null;
  }

  // TODO: Process mementos in sequence to avoid getting ratelimited
  const results = await Promise.all(
    mementos['memento'].map(async (memento) => {
      const page = await browser.newPage();

      try {
        await page.goto(memento.url, { waitUntil: 'networkidle2' });

        let isContentPage = false;

        isContentPage = await Promise.race([
          page.waitForSelector('pierce/.error-page').then(() => false),
          page.waitForSelector('pierce/.section.shop').then(() => true),
          page.waitForSelector('pierce/div.inner__description').then(() => true)
        ]).catch(() => false);

        const resolvedUrl = page.url();

        await page.close();

        if (!resolvedUrl.includes('404.php') && isContentPage) {
          return memento;
        }
      } catch (error) {
        console.error(`Error checking memento URL ${memento.url}:`, error);
        await page.close();
      }

      return null;
    })
  );

  clog.log(`Found ${results.filter((result) => result !== null).length} usable mementos out of ${mementos['memento'].length} total mementos for ${url}`, LOGLEVEL.DEBUG);

  const nonNullResults = results.filter((result) => result !== null);
  const closestResult = nonNullResults.reduce((closest: null | Root, current: Root) => {
    if (!closest) {
      return current;
    }

    return Math.abs(targetDate ? targetDate.getTime() - current.datetime.getTime() : 0) < Math.abs(targetDate ? targetDate.getTime() - closest.datetime.getTime() : 0) ? current : closest;
  }, null);

  return closestResult;
};

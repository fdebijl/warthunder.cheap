import { Browser } from 'puppeteer';
import { getArchiveSnapshots } from './getArchiveSnapshots';

export const findNon404Memento = async (url: string, browser: Browser): Promise<{ url: string; datetime: Date; } | null> => {
  const mementos = await getArchiveSnapshots(url);

  if (mementos['memento'] === undefined) {
    return null;
  }

  const results = await Promise.all(
    mementos['memento'].map(async (memento) => {
      const page = await browser.newPage();
      try {
        await page.goto(memento.url, { waitUntil: 'networkidle2' });
        const resolvedUrl = page.url();
        await page.close();

        // Check if the resolved URL contains "404.php"
        if (!resolvedUrl.includes('404.php')) {
          return memento;
        }
      } catch (error) {
        console.error(`Error checking memento URL ${memento.url}:`, error);
        await page.close();
      }
      return null;
    })
  );

  // Find the first non-null result
  return results.find((result) => result !== null) || null;
};

import { milliseconds } from '@fdebijl/pog';
import { ElementHandle, Frame, Page } from 'puppeteer';

const recursiveFindInFrames = async (inputFrame: Frame, selector: string, options: { timeout: number; }): Promise<ElementHandle<Element> | undefined> => {
  return Promise.race([new Promise<ElementHandle<Element> | undefined>((resolve) => {
    const frames = inputFrame.childFrames();
    frames.forEach(async frame => {
      const el = await frame.$(selector);
      if (el) {
        return resolve(el);
      }

      if (frame.childFrames().length > 0) {
        return resolve(recursiveFindInFrames(frame, selector, options));
      }
    })
  }), milliseconds(options.timeout)]);
}

/** Search through all frames on a page for a selector */
export const findInFrames = async (page: Page, selector: string, options: { timeout: number; } = { timeout: 30_000 }): Promise<ElementHandle<Element> | undefined> => {
  const resultOnPage = await page.$(selector);

  if (resultOnPage) {
    return resultOnPage;
  }

  const result = await recursiveFindInFrames(page.mainFrame(), selector, options);
  return result;
}

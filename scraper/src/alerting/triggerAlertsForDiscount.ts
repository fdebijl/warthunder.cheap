import { Item, MailDiscountFactory, queryAlerts } from 'wtcheap.shared';

import { clog } from '../index.js';
import { discountAlertNeeded } from './alertNeeded.js';

export const triggerAlertsForDiscount = async (currentItem: Item, previousItem: Item) => {
  if (!discountAlertNeeded(currentItem, previousItem)) {
    return;
  }

  clog.log(`Triggering discount alerts for ${currentItem.title}`);

  const alerts = await queryAlerts({ eventType: 'priceChange', itemId: currentItem.id });

  for (const alert of alerts) {
    const factory = new MailDiscountFactory(alert, currentItem);

    await factory.generate()
      .then(f => f.send())
      .then(f => f.cleanup());
  }

  return;
}

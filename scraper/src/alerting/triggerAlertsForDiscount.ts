import { Item, MailDiscountFactory, findAlerts } from 'wtcheap.shared';

import { clog } from '../index';
import { discountAlertNeeded } from './alertNeeded';

export const triggerAlertsForDiscount = async (currentItem: Item, previousItem: Item) => {
  if (!discountAlertNeeded(currentItem, previousItem)) {
    return;
  }

  clog.log(`Triggering discount alerts for ${currentItem.title}`);

  const alerts = await findAlerts({ eventType: 'priceChange', itemId: currentItem.id });

  for (const alert of alerts) {
    const factory = new MailDiscountFactory(alert, currentItem);

    await factory.generate()
      .then(f => f.send())
      .then(f => f.cleanup());
  }

  return;
}

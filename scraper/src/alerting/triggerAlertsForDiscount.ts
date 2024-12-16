import { clog } from '../index';
import { findAlerts } from '../db';
import { Item } from '../domain';
import { discountAlertNeeded } from './alertNeeded';
import { MailDiscountFactory } from './mailfactory';

export const triggerAlertsForDiscount = async (currentItem: Item, previousItem: Item) => {
  if (!discountAlertNeeded(currentItem, previousItem)) {
    return;
  }

  clog.log(`Triggering discount alerts for ${currentItem.title}`);

  const alerts = await findAlerts('priceChange', currentItem.id);

  for (const alert of alerts) {
    const factory = new MailDiscountFactory(alert, currentItem);

    await factory.generate()
      .then(f => f.send())
      .then(f => f.cleanup());
  }

  return;
}

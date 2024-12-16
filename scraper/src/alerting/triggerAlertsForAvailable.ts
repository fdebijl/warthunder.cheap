import { clog } from '../index';
import { findAlerts } from '../db';
import { Item } from '../domain';
import { availableAlertNeeded } from './alertNeeded';
import { MailAvailableFactory } from './mailfactory';

export const triggerAlertsForAvailable = async (currentItem: Item, previousItem: Item) => {
  if (!availableAlertNeeded(currentItem, previousItem)) {
    return;
  }

  clog.log(`Triggering availability alerts for ${currentItem.title}`);

  const alerts = await findAlerts('itemAvailable', currentItem.id);

  for (const alert of alerts) {
    const factory = new MailAvailableFactory(alert, currentItem);

    await factory.generate()
      .then(f => f.send())
      .then(f => f.cleanup());
  }

  return;
}

import { Item, MailAvailableFactory, findAlerts } from 'wtcheap.shared';

import { clog } from '../index';
import { availableAlertNeeded } from './alertNeeded';

export const triggerAlertsForAvailable = async (currentItem: Item, previousItem: Item) => {
  if (!availableAlertNeeded(currentItem, previousItem)) {
    return;
  }

  clog.log(`Triggering availability alerts for ${currentItem.title}`);

  const alerts = await findAlerts({ eventType: 'itemAvailable', itemId: currentItem.id });

  for (const alert of alerts) {
    const factory = new MailAvailableFactory(alert, currentItem);

    await factory.generate()
      .then(f => f.send())
      .then(f => f.cleanup());
  }

  return;
}

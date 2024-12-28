import { Item, MailNewItemFactory, findAlerts } from 'wtcheap.shared';

import { clog } from '../index.js';

export const triggerAlertsForItems = async (newItems: Item[]) => {
  clog.log(`Triggering availability alerts for ${newItems.length} new items`);

  const alerts = await findAlerts({ eventType: 'newItem' });

  for (const alert of alerts) {
    const factory = new MailNewItemFactory(alert, newItems);

    await factory.generate()
      .then(f => f.send());
  }

  return;
};

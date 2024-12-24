import { clog } from '../index';
import { findAlerts } from '../db';
import { Item } from '../domain';
import { MailNewItemFactory } from './mailfactory';

export const triggerAlertsForItems = async (newItems: Item[]) => {
  clog.log(`Triggering availability alerts for ${newItems.length} new items`);

  const alerts = await findAlerts('newItem');

  for (const alert of alerts) {
    const factory = new MailNewItemFactory(alert, newItems);

    await factory.generate()
      .then(f => f.send())
      .then(f => f.cleanup());
  }

  return;
};

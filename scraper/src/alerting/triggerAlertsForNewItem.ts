import { clog } from '../index';
import { Item } from '../domain';

// TODO: Implement
export const triggerAlertsForItems = async (newItems: Item[]) => {
  clog.log(`Triggering alerts for ${newItems.length} new items:`);
  clog.log(newItems.map((item) => item.title).join(', '));
};

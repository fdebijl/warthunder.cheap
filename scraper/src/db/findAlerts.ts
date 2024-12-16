import { Alert, EventType } from '../domain';
import { connect } from './connect';

export const findAlerts = async (eventType: EventType, itemId?: number): Promise<Alert[]> => {
  const db = await connect();
  const collection = db.collection('alerts');

  if (itemId) {
    const alerts = await collection.find<Alert>({ eventType, itemId }).toArray();
    return alerts;
  } else {
    const alerts = await collection.find<Alert>({ eventType }).toArray();
    return alerts;
  }
};

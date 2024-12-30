import { Alert, EventType } from '../../domain/index.js';
import { connect } from '../connect.js';

type AlertsQuery = {
  eventType?: EventType;
  itemId?: number;
  recipient?: string;
}

export const queryAlerts = async (query: AlertsQuery): Promise<Alert[]> => {
  const db = await connect();
  const collection = db.collection('alerts');

  return collection.find<Alert>(query).toArray();
};

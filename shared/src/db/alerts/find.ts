import { ObjectId } from 'mongodb';

import { Alert, EventType } from '../../domain/index.js';
import { connect } from '../connect.js';

type FindAlertsQuery = {
  _id?: ObjectId;
  eventType?: EventType;
  itemId?: number;
  recipient?: string;
}

export const findAlerts = async (query: FindAlertsQuery): Promise<Alert[]> => {
  const db = await connect();
  const collection = db.collection('alerts');

  return collection.find<Alert>(query).toArray();
};

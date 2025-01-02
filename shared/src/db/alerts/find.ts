import { ObjectId } from 'mongodb';

import { Alert } from '../../domain/index.js';
import { connect } from '../connect.js';

export const findAlert = async (id: ObjectId): Promise<Alert | null> => {
  const db = await connect();
  const collection = db.collection('alerts');

  return collection.findOne<Alert>({ _id: id });
};

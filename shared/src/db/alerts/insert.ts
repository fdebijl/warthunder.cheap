import { Alert } from '../../domain/index.js';
import { connect } from '../connect.js';

export const insertAlert = async (alert: Alert): Promise<void> => {
  const db = await connect();
  const collection = db.collection('alerts');

  await collection.insertOne(alert);
};

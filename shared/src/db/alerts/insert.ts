import { Alert } from '../../domain';
import { connect } from '../connect';

export const insertAlert = async (alert: Alert): Promise<void> => {
  const db = await connect();
  const collection = db.collection('alerts');

  await collection.insertOne(alert);
};

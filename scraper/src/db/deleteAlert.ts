import { ObjectId } from 'mongodb';
import { connect } from './connect';

export const deleteAlert = async (alertId: ObjectId | string): Promise<void> => {
  const db = await connect();
  const collection = db.collection('alerts');
  const id = typeof alertId === 'string' ? new ObjectId(alertId) : alertId;

  await collection.deleteOne({ _id: id });
};

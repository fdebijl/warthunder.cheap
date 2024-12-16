import { connect } from './connect';

export const alertExists = async (recipient: string, eventType: string, itemId?: string): Promise<boolean> => {
  const db = await connect();
  const collection = db.collection('alerts');

  if (itemId) {
    const alert = await collection.findOne({ recipient, eventType, itemId });

    return !!alert;
  } else {
    const alert = await collection.findOne({ recipient, eventType });

    return !!alert;
  }
}

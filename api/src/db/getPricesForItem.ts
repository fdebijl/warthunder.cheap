import { Price } from '../domain';
import { connect } from './connect';

export const getPricesForItem = async (itemId: string): Promise<Price[]> => {
  const db = await connect();
  const collection = db.collection('prices');

  return collection.find<Price>({ itemId: Number(itemId) }).toArray();
};

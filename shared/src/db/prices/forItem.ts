import { Price } from '../../domain/index.js';

import { connect } from '../connect.js';

export const getPricesForItem = async (itemId: string): Promise<Price[]> => {
  const db = await connect();
  const collection = db.collection('prices');

  return collection.find<Price>({ itemId: Number(itemId) }).sort({ date: 1 }).toArray();
};

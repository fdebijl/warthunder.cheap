import { Price } from '../../domain/index.js';

import { connect } from '../connect.js';

export const getPricesForItem = async (itemId: string): Promise<Price[]> => {
  const db = await connect();
  const collection = db.collection('prices');

  return collection.aggregate<Price>([
    { $match: { itemId: Number(itemId) } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        priceData: { $first: '$$ROOT' }
      }
    },
    { $replaceRoot: { newRoot: '$priceData' } },
    { $sort: { date: 1 } }
  ]).toArray();
};

import { connect } from '../connect.js';
import { Price } from '../../domain/index.js';
import { queryPrices } from './query.js';

export const insertPrice = async (price: Price): Promise<void> => {
  const db = await connect();

  const countForDate = await queryPrices({ date: price.date });

  if (countForDate.length > 0) {
    return;
  }

  await db.collection('prices').insertOne(price);
}

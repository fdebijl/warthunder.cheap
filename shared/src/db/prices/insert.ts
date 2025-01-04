import { ObjectId } from 'mongodb';
import { connect } from '../connect.js';
import { Price } from '../../domain/index.js';
import { queryPrices } from './query.js';

export const insertPrice = async (price: Price): Promise<ObjectId | void> => {
  const db = await connect();

  const countForDate = await queryPrices({ itemId: price.itemId, date: price.date });

  if (countForDate.length > 0) {
    return;
  }

  const result = await db.collection('prices').insertOne(price);
  return result.insertedId;
}

import { connect } from '../connect.js';
import { Price } from '../../domain/index.js';

export const insertPrice = async (price: Price): Promise<void> => {
  const db = await connect();
  await db.collection('prices').insertOne(price);
}

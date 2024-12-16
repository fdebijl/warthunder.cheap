import { connect } from './connect';
import { Price } from '../domain/price';

export const insertPrice = async (price: Price): Promise<void> => {
  const db = await connect();
  await db.collection('prices').insertOne(price);
}

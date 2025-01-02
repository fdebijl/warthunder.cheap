import { Item } from '../../domain/index.js';
import { connect } from '../connect.js';

export const findItem = async (id: number): Promise<Item | null> => {
  const db = await connect();
  const collection = db.collection('items');

  return collection.findOne<Item>({ id });
};

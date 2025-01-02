import { Item } from '../../domain/index.js';
import { connect } from '../connect.js';

type ItemsQuery = Partial<Item>;

export const queryItems = async (query: ItemsQuery): Promise<Item[]> => {
  const db = await connect();
  const collection = db.collection('alerts');

  return collection.find<Item>(query).toArray();
};

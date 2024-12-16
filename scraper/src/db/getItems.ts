import { WithId } from 'mongodb';

import { connect } from './connect';
import { Item } from '../domain/item';

export const getItems = async (): Promise<Item[]> => {
  const db = await connect();
  return db.collection<WithId<Item>>('items').find().toArray();
}

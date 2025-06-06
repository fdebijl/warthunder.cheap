import { WithId } from 'mongodb';

import { Item } from '../../domain/index.js';
import { connect } from '../connect.js';

export const listItems = async (): Promise<Item[]> => {
  const db = await connect();
  return db.collection<WithId<Item>>('items').find().toArray();
}

export const listArchivedItems = async (): Promise<Item[]> => {
  const db = await connect();
  return db.collection<WithId<Item>>('items').find({ buyable: false }).toArray();
}

export const listCurrentItems = async (): Promise<Item[]> => {
  const db = await connect();
  return db.collection<WithId<Item>>('items').find({ buyable: true }).toArray();
}

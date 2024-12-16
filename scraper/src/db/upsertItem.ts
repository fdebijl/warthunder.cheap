import { LOGLEVEL } from '@fdebijl/clog';

import { connect } from './connect';
import { Item } from '../domain/item';
import { clog } from '../index';

export const upsertItem = async (item: Item): Promise<void> => {
  const db = await connect();

  // Prevent conflicts with $setOnInsert
  delete item.createdAt;

  try {
    await db.collection('items').updateOne(
      { id: item.id },
      {
        $set: {
          ...item,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
  } catch (e) {
    clog.log(`Error upserting item ${item.id}: ${e}`, LOGLEVEL.ERROR);
  }
};

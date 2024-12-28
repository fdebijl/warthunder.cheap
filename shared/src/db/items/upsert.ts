import { LOGLEVEL } from '@fdebijl/clog';

import { Item } from '../../domain/index.js';
import { connect } from '../connect.js';
import { clog } from '../../index.js';

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

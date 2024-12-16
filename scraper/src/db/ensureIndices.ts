import { LOGLEVEL } from '@fdebijl/clog';

import { connect } from './connect';
import { clog } from '../index';

export const ensureIndices = async () => {
  const db = await connect();

  await db.collection('items').createIndex({ buyable: 1 });
  await db.collection('items').createIndex({ id: 1 }, { unique: true });
  await db.collection('items').createIndex({ updatedAt: -1 });
  await db.collection('items').createIndex({ createdAt: -1 });

  await db.collection('prices').createIndex({ itemId: 1 });
  await db.collection('prices').createIndex({ itemId: 1, date: 1 });

  await db.collection('alerts').createIndex({ eventType: 1 });
  await db.collection('alerts').createIndex({ eventType: 1, itemId: 1 });
  await db.collection('alerts').createIndex({ itemId: 1 });


  clog.log('Indices rectified', LOGLEVEL.DEBUG);
}

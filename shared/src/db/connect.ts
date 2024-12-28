import { Db, MongoClient } from 'mongodb';

import { MONGODB_URI } from '../constants.js';

export const connect = async (): Promise<Db> => {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client.db();
}

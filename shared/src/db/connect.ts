import { Db, MongoClient } from 'mongodb';

import { MONGODB_URI } from '../constants.js';

let client: MongoClient | null = null;

export const connect = async (): Promise<Db> => {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
  }
  return client.db();
}

export const disconnect = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
  }
}

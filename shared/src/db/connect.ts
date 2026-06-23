import { Db, MongoClient } from 'mongodb';
import { MONGODB_URI } from '../constants.js';

let clientPromise: Promise<MongoClient> | null = null;

export const connect = async (): Promise<Db> => {
  if (!clientPromise) {
    const client = new MongoClient(MONGODB_URI);
    clientPromise = client.connect().catch((err) => {
      clientPromise = null; // don't cache a failed connect
      throw err;
    });
  }
  const client = await clientPromise;
  return client.db();
};

export const disconnect = async (): Promise<void> => {
  if (clientPromise) {
    const client = await clientPromise.catch(() => null);
    clientPromise = null;
    if (client) await client.close();
  }
};

import { Price } from '../../domain/index.js';
import { connect } from '../connect.js';

type PricesQuery = Partial<Price>;

export const queryPrices = async (query: PricesQuery): Promise<Price[]> => {
  const db = await connect();
  const collection = db.collection('prices');

  return collection.find<Price>(query).toArray();
};

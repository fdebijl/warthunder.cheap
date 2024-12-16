import { ObjectId } from 'mongodb';

export type EventType = 'priceChange' | 'itemAvailable' | 'newItem';

export interface Alert {
  _id?: ObjectId;
  itemId?: number;
  recipient: string;
  eventType: EventType;
}

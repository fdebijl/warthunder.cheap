export interface Memento {
  original: string;
  self: string;
  timegate: string;
  'first memento': string;
  'last memento': string;
  memento: {
    url: string;
    datetime: Date;
  }[];
}

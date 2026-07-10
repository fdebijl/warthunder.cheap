import dotenv from 'dotenv';
dotenv.config();

export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wtcheap';
export const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY as string;
export const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN as string;
export const MAILGUN_SENDER = process.env.MAILGUN_SENDER || 'noreply@warthunder.cheap';
/** Path to the SQLite datamine vehicle DB produced by the extractor (baked into API/scraper images). */
export const VEHICLE_DB_PATH = process.env.VEHICLE_DB_PATH || './vehicles.sqlite';

import dotenv from 'dotenv';
dotenv.config();

export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wtcheap';
export const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY as string;
export const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN as string;
export const MAILGUN_SENDER = process.env.MAILGUN_SENDER || 'noreply@warthunder.cheap';

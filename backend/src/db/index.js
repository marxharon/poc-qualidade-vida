import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import 'dotenv/config';

const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

await client.connect();
export const db = drizzle(client);
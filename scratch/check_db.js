import { dbQuery } from './src/db/db.js';
import * as dotenv from 'dotenv';
dotenv.config();

async function check() {
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
  if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = "postgresql://temple_user:test@127.0.0.1:5432/temple_db";
  }
  const res = await dbQuery("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';");
  console.log("Tables:");
  if (res && res.rows) {
      console.log(res.rows.map(r => r.tablename));
  } else {
      console.log("Query failed");
  }
}
check().catch(console.error);

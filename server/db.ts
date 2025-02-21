import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Add connection retry logic
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

async function createPool(retries = MAX_RETRIES): Promise<Pool> {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    // Test the connection
    await pool.connect();
    console.log("Database connection established successfully");
    return pool;
  } catch (error) {
    if (retries > 0) {
      console.log(`Database connection failed, retrying in ${RETRY_DELAY/1000} seconds... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return createPool(retries - 1);
    }
    throw new Error(`Failed to connect to database after ${MAX_RETRIES} attempts: ${error}`);
  }
}

export const pool = await createPool();
export const db = drizzle({ client: pool, schema });
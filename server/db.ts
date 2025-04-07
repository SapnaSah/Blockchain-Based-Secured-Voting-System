import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// PostgreSQL connection configuration
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

// Create PostgreSQL connection
async function createClient(retries = MAX_RETRIES): Promise<postgres.Sql> {
  try {
    console.log("Attempting to connect to PostgreSQL database...");

    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString, { max: 10 });
    
    // Test the connection
    await client`SELECT 1`;
    console.log("PostgreSQL database connection established successfully");
    
    return client;
  } catch (error) {
    if (retries > 0) {
      console.log(`Database connection failed, retrying in ${RETRY_DELAY/1000} seconds... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return createClient(retries - 1);
    }
    throw new Error(`Failed to connect to PostgreSQL database after ${MAX_RETRIES} attempts: ${error}`);
  }
}

// Initialize connection
let client: postgres.Sql;
let db: ReturnType<typeof drizzle<typeof schema>>;

// Export an initialization function to be called in index.ts
export async function initializeDatabase() {
  client = await createClient();
  db = drizzle(client, { schema });
  return { client, db };
}
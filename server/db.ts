import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";

// MySQL connection configuration
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

// Create MySQL connection
async function createPool(retries = MAX_RETRIES): Promise<mysql.Pool> {
  try {
    console.log("Attempting to connect to MySQL database...");

    // Check if we're in Replit environment with PostgreSQL
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql')) {
      console.log("PostgreSQL detected but MySQL expected - switching to in-memory storage");
      // We'll use in-memory storage since MySQL isn't available in Replit
      return null as any;
    }

    // For local development with MySQL
    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'blockvote',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log("Using MySQL configuration");
    
    // Test the connection
    const [result] = await pool.execute('SELECT 1');
    console.log("MySQL database connection established successfully");
    
    return pool;
  } catch (error) {
    console.log(`Error connecting to MySQL: ${error}`);
    if (retries > 0) {
      console.log(`Database connection failed, retrying in ${RETRY_DELAY/1000} seconds... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return createPool(retries - 1);
    }
    
    console.log("Failed to connect to MySQL database, using in-memory storage instead");
    return null as any; // We'll use in-memory storage
  }
}

// Initialize connection
let pool: mysql.Pool;
let db: ReturnType<typeof drizzle<typeof schema>>;

// Export an initialization function to be called in index.ts
export async function initializeDatabase() {
  try {
    pool = await createPool();
    
    if (pool) {
      db = drizzle(pool, { schema, mode: 'default' });
      return { pool, db };
    } else {
      console.log("Using in-memory storage");
      return { pool: null, db: null };
    }
  } catch (error) {
    console.error("Database initialization error:", error);
    console.log("Falling back to in-memory storage");
    return { pool: null, db: null };
  }
}
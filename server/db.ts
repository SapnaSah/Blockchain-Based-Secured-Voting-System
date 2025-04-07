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

    // MySQL connection configuration
    const connectionString = process.env.DATABASE_URL;
    let pool: mysql.Pool;

    if (connectionString) {
      // Parse connection string if provided (for cloud deployment)
      try {
        const url = new URL(connectionString);
        pool = mysql.createPool({
          host: url.hostname,
          user: url.username,
          password: url.password,
          database: url.pathname.substring(1), // Remove leading slash
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          port: url.port ? parseInt(url.port) : 3306
        });
      } catch (error) {
        console.log("Invalid connection string format, using local configuration");
        throw error;
      }
    } else {
      // For local development on Windows
      pool = mysql.createPool({
        host: 'localhost',
        user: 'root',        // Default MySQL username
        password: '',        // Use your MySQL password here
        database: 'blockvote', // Database name
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      console.log("Using local MySQL configuration (Windows development environment)");
    }
    
    // Test the connection
    const [result] = await pool.execute('SELECT 1');
    console.log("MySQL database connection established successfully");
    
    return pool;
  } catch (error) {
    if (retries > 0) {
      console.log(`Database connection failed, retrying in ${RETRY_DELAY/1000} seconds... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return createPool(retries - 1);
    }
    throw new Error(`Failed to connect to MySQL database after ${MAX_RETRIES} attempts: ${error}`);
  }
}

// Initialize connection
let pool: mysql.Pool;
let db: ReturnType<typeof drizzle<typeof schema>>;

// Export an initialization function to be called in index.ts
export async function initializeDatabase() {
  pool = await createPool();
  db = drizzle(pool, { schema, mode: 'default' }) as any; // Type assertion to avoid compatibility issues
  return { pool, db };
}
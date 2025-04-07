import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import ws from "ws";
import * as schema from "../shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

async function main() {
  try {
    console.log("Connecting to database...");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });
    
    // Push schema to database
    console.log("Pushing schema to database...");
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        email VARCHAR(100),
        bio TEXT,
        avatar_url VARCHAR(255),
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create elections table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS elections (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        created_by INTEGER REFERENCES users(id),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create candidates table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id SERIAL PRIMARY KEY,
        election_id INTEGER REFERENCES elections(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        platform TEXT,
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create votes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        election_id INTEGER REFERENCES elections(id) ON DELETE CASCADE,
        candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
        voter_id INTEGER REFERENCES users(id),
        voter_hash VARCHAR(255) NOT NULL,
        block_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(election_id, voter_id)
      );
    `);
    
    // Create test election with candidates
    const insertTestElection = await pool.query(`
      INSERT INTO elections (title, description, start_date, end_date, is_active)
      VALUES ('Test Election 2024', 'This is a test election for demonstrating the voting platform', 
              CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days', TRUE)
      RETURNING id;
    `);
    
    const electionId = insertTestElection.rows[0].id;
    
    // Add candidates to test election
    await pool.query(`
      INSERT INTO candidates (election_id, name, platform)
      VALUES 
        (${electionId}, 'John Smith', 'Building a better future together'),
        (${electionId}, 'Jane Doe', 'Innovation and progress for all'),
        (${electionId}, 'Alex Johnson', 'Transparency and accountability');
    `);
    
    console.log("Database schema and test data created successfully");
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("Error pushing schema:", error);
    process.exit(1);
  }
}

main();
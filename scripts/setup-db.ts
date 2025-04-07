import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { users, candidates, elections, votes } from '../shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import postgres from 'postgres';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function setupDatabase() {
  console.log("🌱 Starting database setup...");
  
  // Get database URL from environment variable (which should be set in Replit)
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
  }
  
  try {
    console.log(`Connecting to PostgreSQL...`);
    
    // Connect to PostgreSQL
    const client = new Client({
      connectionString,
    });
    
    await client.connect();
    console.log("Connected to PostgreSQL successfully");
    
    // Use raw SQL to create tables (simpler than migrations for this setup)
    console.log("Creating tables if they don't exist...");
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name VARCHAR(255),
        email VARCHAR(255),
        bio TEXT,
        "avatarUrl" TEXT,
        "isAdmin" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS elections (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP NOT NULL,
        active BOOLEAN DEFAULT true,
        "createdBy" INTEGER REFERENCES users(id),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        "electionId" INTEGER NOT NULL REFERENCES elections(id),
        platform TEXT,
        "imageUrl" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES users(id),
        "candidateId" INTEGER NOT NULL REFERENCES candidates(id),
        "electionId" INTEGER NOT NULL REFERENCES elections(id),
        "voterHash" VARCHAR(255) NOT NULL,
        "blockHash" VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add admin user
    const adminPassword = await hashPassword("admin123");
    
    // Check if admin user already exists
    const adminResult = await client.query("SELECT id FROM users WHERE username = 'admin'");
    if (adminResult.rows.length === 0) {
      console.log("Creating admin user...");
      await client.query(
        "INSERT INTO users (username, password, name, email, \"isAdmin\") VALUES ($1, $2, $3, $4, $5)",
        ['admin', adminPassword, 'System Admin', 'admin@blockvote.com', true]
      );
    } else {
      console.log("Admin user already exists, skipping creation.");
    }
    
    // Add regular test user
    const userPassword = await hashPassword("user123");
    
    // Check if test user already exists
    const userResult = await client.query("SELECT id FROM users WHERE username = 'user'");
    if (userResult.rows.length === 0) {
      console.log("Creating test user...");
      await client.query(
        "INSERT INTO users (username, password, name, email) VALUES ($1, $2, $3, $4)",
        ['user', userPassword, 'Regular User', 'user@example.com']
      );
    } else {
      console.log("Test user already exists, skipping creation.");
    }
    
    // Add sample election if none exists
    const electionResult = await client.query("SELECT id FROM elections");
    if (electionResult.rows.length === 0) {
      console.log("Creating sample election...");
      
      // Get admin user id
      const adminResult = await client.query("SELECT id FROM users WHERE username = 'admin'");
      const adminId = adminResult.rows[0].id;
      
      // Create election
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7); // Election lasts 7 days
      
      const electionResult = await client.query(
        "INSERT INTO elections (title, description, \"startDate\", \"endDate\", active, \"createdBy\") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [
          'Presidential Election 2024',
          'Vote for the next president of our nation.',
          startDate,
          endDate,
          true,
          adminId
        ]
      );
      
      const electionId = electionResult.rows[0].id;
      
      // Add candidates
      console.log("Adding candidates to the election...");
      const candidates = [
        {
          name: 'John Smith',
          platform: 'Economic growth and technological innovation.',
          imageUrl: 'https://randomuser.me/api/portraits/men/1.jpg'
        },
        {
          name: 'Sarah Johnson',
          platform: 'Social welfare and environmental protection.',
          imageUrl: 'https://randomuser.me/api/portraits/women/2.jpg'
        },
        {
          name: 'Michael Brown',
          platform: 'National security and traditional values.',
          imageUrl: 'https://randomuser.me/api/portraits/men/3.jpg'
        }
      ];
      
      for (const candidate of candidates) {
        await client.query(
          "INSERT INTO candidates (name, platform, \"imageUrl\", \"electionId\") VALUES ($1, $2, $3, $4)",
          [
            candidate.name,
            candidate.platform,
            candidate.imageUrl,
            electionId
          ]
        );
      }
      
      console.log(`Created election with ID: ${electionId} and added 3 candidates.`);
    } else {
      console.log("Elections already exist, skipping creation.");
    }
    
    console.log("✅ Database setup complete!");
    await client.end();
    
  } catch (error) {
    console.error("❌ Error setting up database:", error);
    process.exit(1);
  }
}

setupDatabase().catch(console.error);
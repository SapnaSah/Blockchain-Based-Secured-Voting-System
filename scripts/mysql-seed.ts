import * as mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { users, candidates, elections, votes } from '../shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

// Load environment variables from .env file
config();

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  console.log("🌱 Starting MySQL database seeding...");
  
  // Explicitly use MySQL connection and ignore environment variable
  const connectionString = 'mysql://root:@localhost:3306/blockvote';
  
  try {
    // Connect to the database
    console.log(`Connecting to MySQL at ${connectionString}...`);
    const connection = await mysql.createConnection(connectionString);
    const db = drizzle(connection);
    
    console.log("Creating tables if they don't exist...");
    
    // Execute manual SQL to create tables (should match schema.ts)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name VARCHAR(255),
        email VARCHAR(255),
        bio TEXT,
        avatarUrl TEXT,
        isAdmin BOOLEAN DEFAULT false,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS elections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        startDate TIMESTAMP NOT NULL,
        endDate TIMESTAMP NOT NULL,
        active BOOLEAN DEFAULT true,
        createdBy INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (createdBy) REFERENCES users(id)
      )
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS candidates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        electionId INT NOT NULL,
        platform TEXT,
        imageUrl TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (electionId) REFERENCES elections(id)
      )
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        candidateId INT NOT NULL,
        electionId INT NOT NULL,
        voterHash VARCHAR(255) NOT NULL,
        blockHash VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (candidateId) REFERENCES candidates(id),
        FOREIGN KEY (electionId) REFERENCES elections(id)
      )
    `);
    
    // Add admin user
    const adminPassword = await hashPassword("admin123");
    
    // Check if admin user already exists
    const [adminRows] = await connection.execute(`SELECT id FROM users WHERE username = 'admin'`);
    if ((adminRows as any[]).length === 0) {
      console.log("Creating admin user...");
      await connection.execute(`
        INSERT INTO users (username, password, name, email, isAdmin)
        VALUES ('admin', ?, 'System Admin', 'admin@blockvote.com', true)
      `, [adminPassword]);
    } else {
      console.log("Admin user already exists, skipping creation.");
    }
    
    // Add regular test user
    const userPassword = await hashPassword("user123");
    
    // Check if test user already exists
    const [userRows] = await connection.execute(`SELECT id FROM users WHERE username = 'user'`);
    if ((userRows as any[]).length === 0) {
      console.log("Creating test user...");
      await connection.execute(`
        INSERT INTO users (username, password, name, email)
        VALUES ('user', ?, 'Regular User', 'user@example.com')
      `, [userPassword]);
    } else {
      console.log("Test user already exists, skipping creation.");
    }
    
    // Add sample election if none exists
    const [electionRows] = await connection.execute(`SELECT id FROM elections`);
    if ((electionRows as any[]).length === 0) {
      console.log("Creating sample election...");
      
      // Get admin user id
      const [adminRows] = await connection.execute(`SELECT id FROM users WHERE username = 'admin'`);
      const adminId = (adminRows as any[])[0].id;
      
      // Create election
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7); // Election lasts 7 days
      
      await connection.execute(`
        INSERT INTO elections (title, description, startDate, endDate, active, createdBy)
        VALUES (?, ?, ?, ?, true, ?)
      `, [
        'Presidential Election 2024',
        'Vote for the next president of our nation.',
        startDate,
        endDate,
        adminId
      ]);
      
      // Get the newly created election ID
      const [newElectionRows] = await connection.execute(`SELECT id FROM elections ORDER BY id DESC LIMIT 1`);
      const electionId = (newElectionRows as any[])[0].id;
      
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
        await connection.execute(`
          INSERT INTO candidates (name, platform, imageUrl, electionId)
          VALUES (?, ?, ?, ?)
        `, [
          candidate.name,
          candidate.platform,
          candidate.imageUrl,
          electionId
        ]);
      }
      
      console.log(`Created election with ID: ${electionId} and added 3 candidates.`);
    } else {
      console.log("Elections already exist, skipping creation.");
    }
    
    console.log("✅ Database seeding complete!");
    await connection.end();
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

main().catch(console.error);
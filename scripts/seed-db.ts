import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Create MySQL connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'voting_app'
    });

    // Initialize Drizzle with the schema
    const db = drizzle(connection, { mode: 'default', schema });

    // Check if users exist
    const existingUsers = await db.select().from(schema.users);
    
    if (existingUsers.length === 0) {
      console.log("No users found, creating admin user...");
      
      // Create admin user
      await db.insert(schema.users).values({
        username: "admin",
        password: await hashPassword("admin123"),
        isAdmin: true,
        displayName: "Administrator"
      });
      
      console.log("Admin user created");
    } else {
      console.log("Users already exist, skipping admin user creation");
    }
    
    // Check if elections exist
    const existingElections = await db.select().from(schema.elections);
    
    if (existingElections.length === 0) {
      console.log("No elections found, creating sample election...");
      
      // Create a sample election
      const result = await db.insert(schema.elections).values({
        title: "Sample Election 2025",
        description: "This is a sample election for testing the voting system",
        startTime: new Date(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        isActive: true
      });
      
      // Get the newly created election
      const elections = await db.select().from(schema.elections);
      const election = elections[elections.length - 1];
      
      if (election) {
        console.log("Sample election created with ID:", election.id);
        
        // Create sample candidates
        await db.insert(schema.candidates).values([
          {
            name: "Candidate 1",
            description: "Sample candidate description 1",
            electionId: election.id
          },
          {
            name: "Candidate 2",
            description: "Sample candidate description 2",
            electionId: election.id
          },
          {
            name: "Candidate 3",
            description: "Sample candidate description 3",
            electionId: election.id
          }
        ]);
        
        console.log("Sample candidates created");
      }
    } else {
      console.log("Elections already exist, skipping sample election creation");
    }
    
    console.log("Database seeding completed successfully");
    
    // Close the connection
    await connection.end();
    
  } catch (error) {
    console.error("Error seeding the database:", error);
    process.exit(1);
  }
}

// Run the seeding process
seedDatabase();
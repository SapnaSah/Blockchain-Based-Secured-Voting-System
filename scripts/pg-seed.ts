import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "../shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seedDatabase() {
  console.log("🌱 Starting PostgreSQL database seeding...");

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const connectionString = process.env.DATABASE_URL;
  console.log(`Connecting to PostgreSQL at ${connectionString}...`);

  try {
    // Create the postgres client
    const queryClient = postgres(connectionString);
    const db = drizzle(queryClient, { schema });

    // Create schema (tables)
    console.log("Creating database schema...");
    await queryClient`
      DROP TABLE IF EXISTS votes CASCADE;
      DROP TABLE IF EXISTS candidates CASCADE;
      DROP TABLE IF EXISTS elections CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `;

    // Create users table
    await queryClient`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN NOT NULL DEFAULT FALSE,
        name VARCHAR(100),
        email VARCHAR(255),
        avatar_url VARCHAR(255),
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create elections table
    await queryClient`
      CREATE TABLE IF NOT EXISTS elections (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create candidates table
    await queryClient`
      CREATE TABLE IF NOT EXISTS candidates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        platform TEXT,
        election_id INTEGER NOT NULL REFERENCES elections(id),
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create votes table
    await queryClient`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        candidate_id INTEGER NOT NULL REFERENCES candidates(id),
        election_id INTEGER NOT NULL REFERENCES elections(id),
        voter_id INTEGER REFERENCES users(id),
        voter_hash VARCHAR(255) NOT NULL,
        block_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Seed users
    console.log("Seeding users...");
    const adminPassword = await hashPassword("admin123");
    const user1Password = await hashPassword("user123");
    const user2Password = await hashPassword("user456");

    await queryClient`
      INSERT INTO users (username, password, is_admin, name, email, bio)
      VALUES 
        ('admin', ${adminPassword}, TRUE, 'Admin User', 'admin@example.com', 'System administrator'),
        ('alice', ${user1Password}, FALSE, 'Alice Smith', 'alice@example.com', 'Regular voter'),
        ('bob', ${user2Password}, FALSE, 'Bob Johnson', 'bob@example.com', 'Election enthusiast')
    `;

    // Seed elections
    console.log("Seeding elections...");
    const startDate1 = new Date();
    const endDate1 = new Date();
    endDate1.setDate(endDate1.getDate() + 7);

    const startDate2 = new Date();
    startDate2.setDate(startDate2.getDate() - 1);
    const endDate2 = new Date();
    endDate2.setDate(endDate2.getDate() + 14);

    await queryClient`
      INSERT INTO elections (title, description, start_date, end_date, is_active, created_by)
      VALUES 
        ('Presidential Election', 'Vote for the next president', ${startDate1}, ${endDate1}, TRUE, 1),
        ('Board Member Elections', 'Select new board members', ${startDate2}, ${endDate2}, TRUE, 1)
    `;

    // Seed candidates
    console.log("Seeding candidates...");
    await queryClient`
      INSERT INTO candidates (name, platform, election_id, image_url)
      VALUES 
        ('John Doe', 'Economic growth and prosperity', 1, 'https://i.pravatar.cc/150?u=john'),
        ('Jane Smith', 'Social justice and equality', 1, 'https://i.pravatar.cc/150?u=jane'),
        ('Alex Johnson', 'Environmental protection', 1, 'https://i.pravatar.cc/150?u=alex'),
        ('Sarah Williams', 'Innovation focus', 2, 'https://i.pravatar.cc/150?u=sarah'),
        ('Michael Brown', 'Fiscal responsibility', 2, 'https://i.pravatar.cc/150?u=michael')
    `;

    console.log("✅ Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
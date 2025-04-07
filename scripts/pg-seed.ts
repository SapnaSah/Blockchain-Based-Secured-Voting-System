import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { elections, candidates, users } from "../shared/schema";
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
    console.log("Seeding database...");

    // PostgreSQL connection
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    // Initialize Drizzle
    const client = postgres(connectionString);
    const db = drizzle(client);

    // Seed admin user
    const adminPassword = await hashPassword("admin123");
    const adminUser = await db.execute(
      `INSERT INTO users (username, password, is_admin, name, bio, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      ["admin", adminPassword, true, "Admin User", "System administrator", new Date()]
    );
    console.log("Admin user created:", adminUser[0].id);

    // Seed regular user
    const userPassword = await hashPassword("user123");
    const regularUser = await db.execute(
      `INSERT INTO users (username, password, is_admin, name, bio, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      ["user", userPassword, false, "Regular User", "A voter in the system", new Date()]
    );
    console.log("Regular user created:", regularUser[0].id);

    // Seed elections
    const presidentialElection = await db.execute(
      `INSERT INTO elections (title, description, start_date, end_date, is_active, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        "Presidential Election 2024",
        "Vote for the next president of the organization",
        new Date("2024-04-01T00:00:00Z"),
        new Date("2024-07-01T23:59:59Z"),
        true,
        adminUser[0].id,
        new Date()
      ]
    );
    console.log("Presidential election created:", presidentialElection[0].id);

    // Seed candidates for presidential election
    const candidate1 = await db.execute(
      `INSERT INTO candidates (name, platform, election_id, created_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        "Jane Smith",
        "Experienced leader with a focus on innovation",
        presidentialElection[0].id,
        new Date()
      ]
    );
    console.log("Candidate 1 created:", candidate1[0].id);

    const candidate2 = await db.execute(
      `INSERT INTO candidates (name, platform, election_id, created_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        "John Doe",
        "Dedicated to transparency and community building",
        presidentialElection[0].id,
        new Date()
      ]
    );
    console.log("Candidate 2 created:", candidate2[0].id);

    const candidate3 = await db.execute(
      `INSERT INTO candidates (name, platform, election_id, created_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        "Alex Johnson",
        "Committed to sustainability and future growth",
        presidentialElection[0].id,
        new Date()
      ]
    );
    console.log("Candidate 3 created:", candidate3[0].id);

    // Seed a board election
    const boardElection = await db.execute(
      `INSERT INTO elections (title, description, start_date, end_date, is_active, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        "Board Member Election",
        "Select new board members for the organization",
        new Date("2024-04-15T00:00:00Z"),
        new Date("2024-05-15T23:59:59Z"),
        true,
        adminUser[0].id,
        new Date()
      ]
    );
    console.log("Board election created:", boardElection[0].id);

    // Seed candidates for board election
    const boardCandidate1 = await db.execute(
      `INSERT INTO candidates (name, platform, election_id, created_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        "Sarah Wilson",
        "Financial expert with 10 years experience",
        boardElection[0].id,
        new Date()
      ]
    );
    console.log("Board candidate 1 created:", boardCandidate1[0].id);

    const boardCandidate2 = await db.execute(
      `INSERT INTO candidates (name, platform, election_id, created_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        "Michael Chen",
        "Technology leader focused on digital transformation",
        boardElection[0].id,
        new Date()
      ]
    );
    console.log("Board candidate 2 created:", boardCandidate2[0].id);

    console.log("Database seeding completed successfully!");
    
    // Close the connection
    await client.end();
    
  } catch (error) {
    console.error("Error seeding the database:", error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
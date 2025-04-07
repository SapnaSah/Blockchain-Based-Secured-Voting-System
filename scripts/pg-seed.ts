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
    const adminUser = await db.insert(users).values({
      username: "admin",
      password: adminPassword,
      isAdmin: true,
      displayName: "Admin User",
      bio: "System administrator"
    }).returning();
    console.log("Admin user created:", adminUser[0].id);

    // Seed regular user
    const userPassword = await hashPassword("user123");
    const regularUser = await db.insert(users).values({
      username: "user",
      password: userPassword,
      isAdmin: false,
      displayName: "Regular User",
      bio: "A voter in the system"
    }).returning();
    console.log("Regular user created:", regularUser[0].id);

    // Seed elections
    const presidentialElection = await db.insert(elections).values({
      title: "Presidential Election 2024",
      description: "Vote for the next president of the organization",
      startTime: new Date("2024-04-01T00:00:00Z"),
      endTime: new Date("2024-07-01T23:59:59Z"),
      isActive: true
    }).returning();
    console.log("Presidential election created:", presidentialElection[0].id);

    // Seed candidates for presidential election
    const candidate1 = await db.insert(candidates).values({
      name: "Jane Smith",
      description: "Experienced leader with a focus on innovation",
      electionId: presidentialElection[0].id
    }).returning();
    console.log("Candidate 1 created:", candidate1[0].id);

    const candidate2 = await db.insert(candidates).values({
      name: "John Doe",
      description: "Dedicated to transparency and community building",
      electionId: presidentialElection[0].id
    }).returning();
    console.log("Candidate 2 created:", candidate2[0].id);

    const candidate3 = await db.insert(candidates).values({
      name: "Alex Johnson",
      description: "Committed to sustainability and future growth",
      electionId: presidentialElection[0].id
    }).returning();
    console.log("Candidate 3 created:", candidate3[0].id);

    // Seed a board election
    const boardElection = await db.insert(elections).values({
      title: "Board Member Election",
      description: "Select new board members for the organization",
      startTime: new Date("2024-04-15T00:00:00Z"),
      endTime: new Date("2024-05-15T23:59:59Z"),
      isActive: true
    }).returning();
    console.log("Board election created:", boardElection[0].id);

    // Seed candidates for board election
    const boardCandidate1 = await db.insert(candidates).values({
      name: "Sarah Wilson",
      description: "Financial expert with 10 years experience",
      electionId: boardElection[0].id
    }).returning();
    console.log("Board candidate 1 created:", boardCandidate1[0].id);

    const boardCandidate2 = await db.insert(candidates).values({
      name: "Michael Chen",
      description: "Technology leader focused on digital transformation",
      electionId: boardElection[0].id
    }).returning();
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
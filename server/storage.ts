import { eq } from "drizzle-orm";
import { initializeDatabase } from "./db";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { blockchain } from "./blockchain";
import crypto from 'crypto';
import { User, Candidate, Election, Vote, InsertUser, users, candidates, elections, votes } from "@shared/schema";

const PostgresStore = connectPgSimple(session);

export class DatabaseStorage {
  sessionStore: session.Store;
  db: any;

  constructor() {
    // Use PostgreSQL session store
    this.sessionStore = new PostgresStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true
    });
    
    // Initialize db lazily - will be set later
    this.db = null;
  }
  
  async init() {
    const { db } = await initializeDatabase();
    this.db = db;
    return this;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.db.insert(users).values(insertUser).returning();
    return user;
  }

  async createCandidate(candidate: Omit<Candidate, "id">): Promise<Candidate> {
    const [newCandidate] = await this.db.insert(candidates).values(candidate).returning();
    return newCandidate;
  }

  async getCandidates(electionId: number): Promise<Candidate[]> {
    return await this.db.select().from(candidates).where(eq(candidates.electionId, electionId));
  }

  async createElection(election: Omit<Election, "id">): Promise<Election> {
    const [newElection] = await this.db.insert(elections).values(election).returning();
    return newElection;
  }

  async getElections(): Promise<Election[]> {
    return await this.db.select().from(elections);
  }

  async castVote(vote: Omit<Vote, "id" | "blockHash">): Promise<Vote> {
    const block = blockchain.addBlock({
      candidateId: vote.candidateId,
      electionId: vote.electionId,
      voterHash: vote.voterHash,
    });

    const [newVote] = await this.db
      .insert(votes)
      .values({ ...vote, blockHash: block.hash })
      .returning();
    return newVote;
  }

  async getVotes(electionId: number): Promise<Vote[]> {
    return await this.db.select().from(votes).where(eq(votes.electionId, electionId));
  }

  async makeAdmin(userId: number): Promise<void> {
    await this.db
      .update(users)
      .set({ isAdmin: true })
      .where(eq(users.id, userId));
  }

  async updateUser(id: number, updates: Partial<Omit<User, "id" | "password" | "username" | "isAdmin">>): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }
}

// Create storage instance that will be initialized later
export const storage = new DatabaseStorage();
import { eq } from "drizzle-orm";
import { initializeDatabase } from "./db";
import session from "express-session";
import { blockchain } from "./blockchain";
import crypto from 'crypto';
import { User, Candidate, Election, Vote, InsertUser, users, candidates, elections, votes } from "@shared/schema";

// Use the memory store for session management as MySQL doesn't have a native session store
import createMemoryStore from "memorystore";
const MemoryStore = createMemoryStore(session);

export class DatabaseStorage {
  sessionStore: session.Store;
  db: any;

  constructor() {
    // Use in-memory session store since we're now using MySQL
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
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
    // Pass the voter hash to blockchain - it will handle null values
    const block = blockchain.addBlock({
      candidateId: vote.candidateId,
      electionId: vote.electionId,
      voterHash: vote.voterHash,
    });

    // Store the vote with the block hash
    const [newVote] = await this.db
      .insert(votes)
      .values({ 
        ...vote, 
        blockHash: block.hash,
        // Ensure voterHash has a value if it was null (MySQL doesn't like nulls)
        voterHash: vote.voterHash || block.vote.voterHash
      })
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
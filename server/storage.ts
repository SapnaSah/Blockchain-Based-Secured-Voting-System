import { Pool } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { db } from "./db";
import session from "express-session";
import createMemoryStore from "memorystore";
import { blockchain } from "./blockchain";
import crypto from 'crypto';
import connectPg from "connect-pg-simple";
import { User, Candidate, Election, Vote, InsertUser, users, candidates, elections, votes } from "@shared/schema";

const PostgresStore = connectPg(session);

export class DatabaseStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createCandidate(candidate: Omit<Candidate, "id">): Promise<Candidate> {
    const [newCandidate] = await db.insert(candidates).values(candidate).returning();
    return newCandidate;
  }

  async getCandidates(electionId: number): Promise<Candidate[]> {
    return await db.select().from(candidates).where(eq(candidates.electionId, electionId));
  }

  async createElection(election: Omit<Election, "id">): Promise<Election> {
    const [newElection] = await db.insert(elections).values(election).returning();
    return newElection;
  }

  async getElections(): Promise<Election[]> {
    return await db.select().from(elections);
  }

  async castVote(vote: Omit<Vote, "id" | "blockHash">): Promise<Vote> {
    const block = blockchain.addBlock({
      candidateId: vote.candidateId,
      electionId: vote.electionId,
      voterHash: vote.voterHash,
    });

    const [newVote] = await db
      .insert(votes)
      .values({ ...vote, blockHash: block.hash })
      .returning();
    return newVote;
  }

  async getVotes(electionId: number): Promise<Vote[]> {
    return await db.select().from(votes).where(eq(votes.electionId, electionId));
  }

  async makeAdmin(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ isAdmin: true })
      .where(eq(users.id, userId));
  }

  async updateUser(id: number, updates: Partial<Omit<User, "id" | "password" | "username" | "isAdmin">>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
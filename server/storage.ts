import { eq } from "drizzle-orm";
import { initializeDatabase } from "./db";
import session from "express-session";
import { blockchain } from "./blockchain";
import crypto from 'crypto';
import { User, Candidate, Election, Vote, InsertUser, users, candidates, elections, votes } from "@shared/schema";

// Use memory store for session management
import createMemoryStore from "memorystore";
const MemoryStore = createMemoryStore(session);

// MemStorage is an in-memory alternative when the database is not available
class MemStorage {
  private users: User[] = [];
  private candidates: Candidate[] = [];
  private elections: Election[] = [];
  private votes: Vote[] = [];
  sessionStore: session.Store;
  
  constructor() {
    // Create session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Seed the database with sample data
    this.seedSampleData();
  }
  
  private seedSampleData() {
    // Create sample admin user
    this.users.push({
      id: 1,
      username: "admin",
      password: "admin123", // This would normally be hashed
      isAdmin: true,
      name: "Admin User",
      email: "admin@example.com",
      bio: "System administrator",
      avatarUrl: null,
      createdAt: new Date()
    });
    
    // Create sample regular users
    this.users.push({
      id: 2,
      username: "alice",
      password: "user123", // This would normally be hashed
      isAdmin: false,
      name: "Alice Smith",
      email: "alice@example.com",
      bio: "Regular voter",
      avatarUrl: null,
      createdAt: new Date()
    });
    
    this.users.push({
      id: 3,
      username: "bob",
      password: "user456", // This would normally be hashed
      isAdmin: false,
      name: "Bob Johnson",
      email: "bob@example.com",
      bio: "Election enthusiast",
      avatarUrl: null,
      createdAt: new Date()
    });
    
    // Create sample elections
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    
    this.elections.push({
      id: 1,
      title: "Presidential Election",
      description: "Vote for the next president",
      startDate,
      endDate,
      isActive: true,
      createdBy: 1,
      createdAt: new Date()
    });
    
    const startDate2 = new Date();
    startDate2.setDate(startDate2.getDate() - 1);
    const endDate2 = new Date();
    endDate2.setDate(endDate2.getDate() + 14);
    
    this.elections.push({
      id: 2,
      title: "Board Member Elections",
      description: "Select new board members",
      startDate: startDate2,
      endDate: endDate2,
      isActive: true,
      createdBy: 1,
      createdAt: new Date()
    });
    
    // Create sample candidates
    this.candidates.push({
      id: 1,
      name: "John Doe",
      platform: "Economic growth and prosperity",
      electionId: 1,
      imageUrl: "https://i.pravatar.cc/150?u=john",
      createdAt: new Date()
    });
    
    this.candidates.push({
      id: 2,
      name: "Jane Smith",
      platform: "Social justice and equality",
      electionId: 1,
      imageUrl: "https://i.pravatar.cc/150?u=jane",
      createdAt: new Date()
    });
    
    this.candidates.push({
      id: 3,
      name: "Alex Johnson",
      platform: "Environmental protection",
      electionId: 1,
      imageUrl: "https://i.pravatar.cc/150?u=alex",
      createdAt: new Date()
    });
    
    this.candidates.push({
      id: 4,
      name: "Sarah Williams",
      platform: "Innovation focus",
      electionId: 2,
      imageUrl: "https://i.pravatar.cc/150?u=sarah",
      createdAt: new Date()
    });
    
    this.candidates.push({
      id: 5,
      name: "Michael Brown",
      platform: "Fiscal responsibility",
      electionId: 2,
      imageUrl: "https://i.pravatar.cc/150?u=michael",
      createdAt: new Date()
    });
    
    console.log("Seeded in-memory database with sample data");
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.users.length > 0 ? Math.max(...this.users.map(u => u.id)) + 1 : 1;
    const user: User = {
      id,
      ...insertUser,
      isAdmin: false,
      avatarUrl: null,
      createdAt: new Date()
    };
    this.users.push(user);
    return user;
  }
  
  async createCandidate(candidate: Omit<Candidate, "id">): Promise<Candidate> {
    const id = this.candidates.length > 0 ? Math.max(...this.candidates.map(c => c.id)) + 1 : 1;
    const newCandidate: Candidate = {
      id,
      ...candidate,
      createdAt: new Date()
    };
    this.candidates.push(newCandidate);
    return newCandidate;
  }
  
  async getCandidates(electionId: number): Promise<Candidate[]> {
    return this.candidates.filter(candidate => candidate.electionId === electionId);
  }
  
  async createElection(election: Omit<Election, "id">): Promise<Election> {
    const id = this.elections.length > 0 ? Math.max(...this.elections.map(e => e.id)) + 1 : 1;
    const newElection: Election = {
      id,
      ...election,
      createdAt: new Date()
    };
    this.elections.push(newElection);
    return newElection;
  }
  
  async getElections(): Promise<Election[]> {
    return [...this.elections];
  }
  
  async castVote(vote: Omit<Vote, "id" | "blockHash">): Promise<Vote> {
    const block = blockchain.addBlock({
      candidateId: vote.candidateId,
      electionId: vote.electionId,
      voterHash: vote.voterHash,
    });
    
    const id = this.votes.length > 0 ? Math.max(...this.votes.map(v => v.id)) + 1 : 1;
    const newVote: Vote = {
      id,
      ...vote,
      blockHash: block.hash,
      voterHash: vote.voterHash || block.vote.voterHash,
      createdAt: new Date()
    };
    this.votes.push(newVote);
    return newVote;
  }
  
  async getVotes(electionId: number): Promise<Vote[]> {
    return this.votes.filter(vote => vote.electionId === electionId);
  }
  
  async makeAdmin(userId: number): Promise<void> {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.isAdmin = true;
    }
  }
  
  async updateUser(id: number, updates: Partial<Omit<User, "id" | "password" | "username" | "isAdmin">>): Promise<User> {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    Object.assign(user, updates);
    return user;
  }
}

export class DatabaseStorage {
  sessionStore: session.Store;
  db: any;
  memStorage: MemStorage;
  usingInMemory: boolean = false;

  constructor() {
    // Use in-memory session store 
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize db lazily - will be set later
    this.db = null;
    
    // Create a memory storage as a fallback
    this.memStorage = new MemStorage();
  }
  
  async init() {
    try {
      const { db } = await initializeDatabase();
      this.db = db;
      
      if (!this.db) {
        console.log("Database not available, using in-memory storage");
        this.usingInMemory = true;
      }
      
      return this;
    } catch (error) {
      console.error("Error initializing database:", error);
      console.log("Falling back to in-memory storage");
      this.usingInMemory = true;
      return this;
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    if (this.usingInMemory) {
      return this.memStorage.getUser(id);
    }
    
    try {
      const [user] = await this.db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Database error, falling back to in-memory:", error);
      this.usingInMemory = true;
      return this.memStorage.getUser(id);
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (this.usingInMemory) {
      return this.memStorage.getUserByUsername(username);
    }
    
    try {
      const [user] = await this.db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Database error, falling back to in-memory:", error);
      this.usingInMemory = true;
      return this.memStorage.getUserByUsername(username);
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (this.usingInMemory) {
      return this.memStorage.createUser(insertUser);
    }
    
    try {
      const [user] = await this.db.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error("Database error, falling back to in-memory:", error);
      this.usingInMemory = true;
      return this.memStorage.createUser(insertUser);
    }
  }

  async createCandidate(candidate: Omit<Candidate, "id">): Promise<Candidate> {
    if (this.usingInMemory) {
      return this.memStorage.createCandidate(candidate);
    }
    
    try {
      const [newCandidate] = await this.db.insert(candidates).values(candidate).returning();
      return newCandidate;
    } catch (error) {
      console.error("Database error, falling back to in-memory:", error);
      this.usingInMemory = true;
      return this.memStorage.createCandidate(candidate);
    }
  }

  async getCandidates(electionId: number): Promise<Candidate[]> {
    if (this.usingInMemory) {
      return this.memStorage.getCandidates(electionId);
    }
    
    try {
      return await this.db.select().from(candidates).where(eq(candidates.electionId, electionId));
    } catch (error) {
      console.error("Database error, falling back to in-memory:", error);
      this.usingInMemory = true;
      return this.memStorage.getCandidates(electionId);
    }
  }

  async createElection(election: Omit<Election, "id">): Promise<Election> {
    if (this.usingInMemory) {
      return this.memStorage.createElection(election);
    }
    
    try {
      const [newElection] = await this.db.insert(elections).values(election).returning();
      return newElection;
    } catch (error) {
      console.error("Database error, falling back to in-memory:", error);
      this.usingInMemory = true;
      return this.memStorage.createElection(election);
    }
  }

  async getElections(): Promise<Election[]> {
    if (this.usingInMemory) {
      return this.memStorage.getElections();
    }
    
    try {
      return await this.db.select().from(elections);
    } catch (error) {
      console.error("Database error, falling back to in-memory:", error);
      this.usingInMemory = true;
      return this.memStorage.getElections();
    }
  }

  async castVote(vote: Omit<Vote, "id" | "blockHash">): Promise<Vote> {
    if (this.usingInMemory) {
      return this.memStorage.castVote(vote);
    }
    
    try {
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
    } catch (error) {
      console.error("Database error, falling back to in-memory:", error);
      this.usingInMemory = true;
      return this.memStorage.castVote(vote);
    }
  }

  async getVotes(electionId: number): Promise<Vote[]> {
    if (this.usingInMemory) {
      return this.memStorage.getVotes(electionId);
    }
    
    try {
      return await this.db.select().from(votes).where(eq(votes.electionId, electionId));
    } catch (error) {
      console.error("Database error, falling back to in-memory:", error);
      this.usingInMemory = true;
      return this.memStorage.getVotes(electionId);
    }
  }

  async makeAdmin(userId: number): Promise<void> {
    if (this.usingInMemory) {
      await this.memStorage.makeAdmin(userId);
      return;
    }
    
    try {
      await this.db
        .update(users)
        .set({ isAdmin: true })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error("Database error, falling back to in-memory:", error);
      this.usingInMemory = true;
      await this.memStorage.makeAdmin(userId);
    }
  }

  async updateUser(id: number, updates: Partial<Omit<User, "id" | "password" | "username" | "isAdmin">>): Promise<User> {
    if (this.usingInMemory) {
      return this.memStorage.updateUser(id, updates);
    }
    
    try {
      const [user] = await this.db
        .update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();
      return user;
    } catch (error) {
      console.error("Database error, falling back to in-memory:", error);
      this.usingInMemory = true;
      return this.memStorage.updateUser(id, updates);
    }
  }
}

// Create storage instance that will be initialized later
export const storage = new DatabaseStorage();
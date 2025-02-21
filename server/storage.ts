import { IStorage } from "./storage";
import { User, Candidate, Election, Vote, InsertUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { blockchain } from "./blockchain";
import crypto from 'crypto';

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private candidates: Map<number, Candidate>;
  private elections: Map<number, Election>;
  private votes: Map<number, Vote>;
  sessionStore: session.Store;
  currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.candidates = new Map();
    this.elections = new Map();
    this.votes = new Map();
    this.currentId = { users: 1, candidates: 1, elections: 1, votes: 1 };
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id, isAdmin: false };
    this.users.set(id, user);
    return user;
  }

  async createCandidate(candidate: Omit<Candidate, "id">): Promise<Candidate> {
    const id = this.currentId.candidates++;
    const newCandidate: Candidate = { ...candidate, id };
    this.candidates.set(id, newCandidate);
    return newCandidate;
  }

  async getCandidates(electionId: number): Promise<Candidate[]> {
    return Array.from(this.candidates.values()).filter(
      (candidate) => candidate.electionId === electionId
    );
  }

  async createElection(election: Omit<Election, "id">): Promise<Election> {
    const id = this.currentId.elections++;
    const newElection: Election = { ...election, id };
    this.elections.set(id, newElection);
    return newElection;
  }

  async getElections(): Promise<Election[]> {
    return Array.from(this.elections.values());
  }

  async castVote(vote: Omit<Vote, "id" | "blockHash">): Promise<Vote> {
    const block = blockchain.addBlock({
      candidateId: vote.candidateId,
      electionId: vote.electionId,
      voterHash: vote.voterHash,
    });

    const id = this.currentId.votes++;
    const newVote: Vote = { ...vote, id, blockHash: block.hash };
    this.votes.set(id, newVote);
    return newVote;
  }

  async getVotes(electionId: number): Promise<Vote[]> {
    return Array.from(this.votes.values()).filter(
      (vote) => vote.electionId === electionId
    );
  }

  async makeAdmin(userId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      user.isAdmin = true;
      this.users.set(userId, user);
    }
  }
}

export const storage = new MemStorage();

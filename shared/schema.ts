import { pgTable, text, varchar, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  name: varchar("name", { length: 100 }),
  email: varchar("email", { length: 255 }),
  avatarUrl: varchar("avatar_url", { length: 255 }),
  bio: text("bio"),
  createdAt: timestamp("created_at")
});

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  platform: text("platform"),
  electionId: serial("election_id").notNull(),
  imageUrl: varchar("image_url", { length: 255 }),
  createdAt: timestamp("created_at")
});

export const elections = pgTable("elections", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: serial("created_by"),
  createdAt: timestamp("created_at")
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  candidateId: serial("candidate_id").notNull(),
  electionId: serial("election_id").notNull(),
  voterId: serial("voter_id"),
  voterHash: varchar("voter_hash", { length: 255 }),
  blockHash: varchar("block_hash", { length: 255 }),
  createdAt: timestamp("created_at")
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  bio: true
});

export const insertCandidateSchema = createInsertSchema(candidates);
export const insertElectionSchema = createInsertSchema(elections);
export const insertVoteSchema = createInsertSchema(votes);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Candidate = typeof candidates.$inferSelect;
export type Election = typeof elections.$inferSelect;
export type Vote = typeof votes.$inferSelect;
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio")
});

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  electionId: integer("election_id").notNull()
});

export const elections = pgTable("elections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isActive: boolean("is_active").notNull().default(true)
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  electionId: integer("election_id").notNull(),
  voterHash: text("voter_hash").notNull(), 
  timestamp: timestamp("timestamp").notNull(),
  blockHash: text("block_hash").notNull()
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
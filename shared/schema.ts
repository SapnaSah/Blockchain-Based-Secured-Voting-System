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
  createdAt: timestamp("created_at").defaultNow()
});

export const elections = pgTable("elections", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: serial("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  platform: text("platform"),
  electionId: serial("election_id").notNull().references(() => elections.id),
  imageUrl: varchar("image_url", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow()
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  candidateId: serial("candidate_id").notNull().references(() => candidates.id),
  electionId: serial("election_id").notNull().references(() => elections.id),
  voterId: serial("voter_id").references(() => users.id),
  voterHash: varchar("voter_hash", { length: 255 }).notNull(), 
  blockHash: varchar("block_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  bio: true
});

export const insertCandidateSchema = createInsertSchema(candidates).pick({
  name: true,
  platform: true,
  electionId: true,
  imageUrl: true
});

export const insertElectionSchema = createInsertSchema(elections).pick({
  title: true,
  description: true,
  startDate: true,
  endDate: true,
  isActive: true,
  createdBy: true
});

export const insertVoteSchema = createInsertSchema(votes).pick({
  candidateId: true,
  electionId: true,
  voterId: true,
  voterHash: true,
  blockHash: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Candidate = typeof candidates.$inferSelect;
export type Election = typeof elections.$inferSelect;
export type Vote = typeof votes.$inferSelect;
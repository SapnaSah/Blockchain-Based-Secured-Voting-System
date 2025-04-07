import { mysqlTable, text, varchar, int, boolean, timestamp, primaryKey } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  name: varchar("name", { length: 100 }),
  email: varchar("email", { length: 255 }),
  avatarUrl: varchar("avatar_url", { length: 255 }),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow()
});

export const elections = mysqlTable("elections", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: int("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

export const candidates = mysqlTable("candidates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  platform: text("platform"),
  electionId: int("election_id").notNull().references(() => elections.id),
  imageUrl: varchar("image_url", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow()
});

export const votes = mysqlTable("votes", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidate_id").notNull().references(() => candidates.id),
  electionId: int("election_id").notNull().references(() => elections.id),
  voterId: int("voter_id").references(() => users.id),
  voterHash: varchar("voter_hash", { length: 255 }).notNull(), // Make it required for MySQL compatibility
  blockHash: varchar("block_hash", { length: 255 }).notNull(), // Make it required for MySQL compatibility
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
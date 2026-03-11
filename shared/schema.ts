import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  joinDate: text("join_date").notNull().default(""),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  freezePoints: integer("freeze_points").notNull().default(0),
  totalWins: integer("total_wins").notNull().default(0),
  totalRelapses: integer("total_relapses").notNull().default(0),
  lastCheckInDate: text("last_check_in_date"),
  shrineUnlocked: boolean("shrine_unlocked").notNull().default(false),
  checkpointUnlocked: boolean("checkpoint_unlocked").notNull().default(false),
  currentLevel: integer("current_level").notNull().default(1),
  journeyPosition: integer("journey_position").notNull().default(0),
  lastAppOpenDate: text("last_app_open_date"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

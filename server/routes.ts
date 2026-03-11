import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { users } from "../shared/schema";
import { saveBackup } from "./backup";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function applyMissedDayLogic(user: typeof users.$inferSelect): typeof users.$inferSelect {
  const today = getTodayString();
  if (user.lastAppOpenDate === today) return user;

  const updated = { ...user, lastAppOpenDate: today };
  if (!user.lastCheckInDate) return updated;

  const daysSince = daysBetween(user.lastCheckInDate, today);
  if (daysSince >= 2) {
    if (user.freezePoints > 0) {
      return { ...updated, freezePoints: updated.freezePoints - 1 };
    } else {
      return { ...updated, currentStreak: 0, currentLevel: 1, journeyPosition: 0 };
    }
  }
  return updated;
}

function toPublicUser(user: typeof users.$inferSelect) {
  const { password, ...pub } = user;
  return pub;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }
    if (username.length < 3) {
      return res.status(400).json({ error: "ID must be at least 3 characters." });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters." });
    }

    const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: "This ID is already taken. Choose another." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const today = getTodayString();
    const [user] = await db.insert(users).values({
      username,
      password: hashed,
      joinDate: today,
      lastAppOpenDate: today,
    }).returning();

    const allUsers = await db.select().from(users);
    saveBackup(allUsers);

    return res.json({ user: toPublicUser(user) });
  });

  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (!user) {
      return res.status(401).json({ error: "No account found with this ID." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Incorrect password." });
    }

    const updated = applyMissedDayLogic(user);
    if (updated !== user) {
      await db.update(users).set(updated).where(eq(users.username, username));
    }

    return res.json({ user: toPublicUser(updated) });
  });

  app.get("/api/user/:username", async (req, res) => {
    const [user] = await db.select().from(users).where(eq(users.username, req.params.username)).limit(1);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    const updated = applyMissedDayLogic(user);
    if (updated !== user) {
      await db.update(users).set(updated).where(eq(users.username, req.params.username));
    }
    return res.json({ user: toPublicUser(updated) });
  });

  app.put("/api/user/:username", async (req, res) => {
    const { username } = req.params;
    const updates = req.body;

    delete updates.password;
    delete updates.id;

    await db.update(users).set(updates).where(eq(users.username, username));
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const allUsers = await db.select().from(users);
    saveBackup(allUsers);

    return res.json({ user: toPublicUser(user) });
  });

  const httpServer = createServer(app);
  return httpServer;
}

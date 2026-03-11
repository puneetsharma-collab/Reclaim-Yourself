import * as fs from "fs";
import * as path from "path";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users } from "../shared/schema";

const BACKUP_PATH = path.resolve(process.cwd(), "data", "db-backup.json");

function getDb() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return { db: drizzle(pool), pool };
}

export async function saveBackup(allUsers: (typeof users.$inferSelect)[]): Promise<void> {
  try {
    fs.mkdirSync(path.dirname(BACKUP_PATH), { recursive: true });
    fs.writeFileSync(BACKUP_PATH, JSON.stringify(allUsers, null, 2), "utf-8");
  } catch (err) {
    console.error("[backup] Failed to write backup:", err);
  }
}

export async function restoreFromBackupIfNeeded(): Promise<void> {
  const { db, pool } = getDb();
  try {
    const existing = await db.select().from(users);

    if (existing.length > 0) {
      console.log(`[backup] Database has ${existing.length} user(s). Saving fresh backup.`);
      await saveBackup(existing);
      return;
    }

    if (!fs.existsSync(BACKUP_PATH)) {
      console.log("[backup] No backup file found, skipping restore.");
      return;
    }

    const raw = fs.readFileSync(BACKUP_PATH, "utf-8");
    const backed: (typeof users.$inferSelect)[] = JSON.parse(raw);

    if (!Array.isArray(backed) || backed.length === 0) {
      console.log("[backup] Backup file is empty, nothing to restore.");
      return;
    }

    await db.insert(users).values(backed);
    console.log(`[backup] Restored ${backed.length} user(s) from backup.`);
  } catch (err) {
    console.error("[backup] Restore failed:", err);
  } finally {
    await pool.end();
  }
}

import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDbPath(): string {
  const dir = join(process.cwd(), ".data");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return join(dir, "kwala-chat.db");
}

export function getDb() {
  if (!_db) {
    const dbPath = getDbPath();
    const sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");

    _db = drizzle(sqlite, { schema });

    // Auto-create tables
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS chat (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS message (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL REFERENCES chat(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        parts TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_message_chat_id ON message(chat_id);
    `);
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    return Reflect.get(getDb(), prop);
  },
});

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/** Chat table - stores chat sessions */
export const chat = sqliteTable("chat", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

/** Message table - stores chat messages with parts (AI SDK format) */
export const message = sqliteTable("message", {
  id: text("id").primaryKey(),
  chatId: text("chat_id")
    .references(() => chat.id, { onDelete: "cascade" })
    .notNull(),
  role: text("role").notNull(), // 'user' | 'assistant'
  parts: text("parts").notNull(), // JSON stringified array of message parts
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type Chat = typeof chat.$inferSelect;
export type NewChat = typeof chat.$inferInsert;
export type Message = typeof message.$inferSelect;
export type NewMessage = typeof message.$inferInsert;

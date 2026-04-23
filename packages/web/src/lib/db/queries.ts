import { eq, desc } from "drizzle-orm";
import { db } from "./index";
import { chat, message } from "./schema";
import type { NewChat, NewMessage, Chat } from "./schema";

// ============================================================================
// Chat Queries
// ============================================================================

export async function getChatById(id: string) {
  const [result] = await db.select().from(chat).where(eq(chat.id, id)).limit(1);
  return result ?? null;
}

export async function createChat(data: NewChat) {
  const [result] = await db.insert(chat).values(data).returning();
  return result;
}

export async function updateChatTitle(id: string, title: string) {
  await db.update(chat).set({ title }).where(eq(chat.id, id));
}

export async function deleteChat(id: string) {
  await db.delete(chat).where(eq(chat.id, id));
}

export async function getRecentChats(
  limit = 50
): Promise<Chat[]> {
  return db
    .select()
    .from(chat)
    .orderBy(desc(chat.createdAt))
    .limit(limit);
}

// ============================================================================
// Message Queries
// ============================================================================

export async function getMessagesByChatId(chatId: string) {
  return db
    .select()
    .from(message)
    .where(eq(message.chatId, chatId))
    .orderBy(message.createdAt);
}

export async function saveMessages({
  chatId,
  messages: msgs,
}: {
  chatId: string;
  messages: Array<{ id: string; role: string; parts: unknown[] }>;
}) {
  if (msgs.length === 0) return;

  const values: NewMessage[] = msgs.map((m) => ({
    id: m.id,
    chatId,
    role: m.role,
    parts: JSON.stringify(m.parts),
    createdAt: new Date(),
  }));

  await db.insert(message).values(values).onConflictDoNothing();
}

export async function deleteMessagesByChatId(chatId: string) {
  await db.delete(message).where(eq(message.chatId, chatId));
}

/** Generate chat title from first message */
export function extractChatTitle(text: string): string {
  const maxLength = 50;
  const cleaned = text.replace(/\n/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength - 3) + "...";
}

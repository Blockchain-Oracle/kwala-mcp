"use client";

import { useMemo } from "react";
import { Chat } from "@/components/chat/chat";

export default function ChatPage() {
  // Generate a stable UUID for new chat sessions
  const chatId = useMemo(() => crypto.randomUUID(), []);

  return <Chat id={chatId} />;
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Chat } from "@/components/chat/chat";
import type { UIMessage } from "@ai-sdk/react";
import { Loader2 } from "lucide-react";

export default function ChatByIdPage() {
  const params = useParams();
  const id = params.id as string;
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await fetch(`/api/chat/${id}`);
        if (res.ok) {
          const messages = await res.json();
          setInitialMessages(messages);
        } else {
          setInitialMessages([]);
        }
      } catch {
        setInitialMessages([]);
      } finally {
        setLoading(false);
      }
    }
    loadMessages();
  }, [id]);

  if (loading || initialMessages === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            Loading chat...
          </span>
        </div>
      </div>
    );
  }

  return <Chat id={id} initialMessages={initialMessages} />;
}

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { useSWRConfig } from "swr";
import { Messages } from "./messages";
import { ChatInput } from "./chat-input";
import { SuggestedActions } from "./suggested-actions";
import { Terminal } from "lucide-react";
import { useWalletAddress } from "@/components/wallet/use-wallet-address";
import { WALLET_ADDRESS_HEADER } from "@/lib/wallet/constants";

interface ChatProps {
  id: string;
  initialMessages?: UIMessage[];
}

export function Chat({ id, initialMessages = [] }: ChatProps) {
  const [input, setInput] = useState("");
  const pathname = usePathname();
  const { mutate } = useSWRConfig();
  const hasUpdatedUrl = useRef(false);
  const isNewChat = pathname === "/chat";
  const address = useWalletAddress();

  const { messages, sendMessage, addToolOutput, status, stop } = useChat({
    id,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { id },
      headers: { [WALLET_ADDRESS_HEADER]: address ?? "" },
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onFinish: () => {
      mutate("/api/history?limit=50");
    },
  });

  const isLoading = status === "streaming" || status === "submitted";
  const isEmpty = messages.length === 0;

  // Update URL after first message
  useEffect(() => {
    if (isNewChat && messages.length > 0 && !hasUpdatedUrl.current) {
      hasUpdatedUrl.current = true;
      window.history.replaceState({}, "", `/chat/${id}`);
      mutate("/api/history?limit=50");
    }
  }, [isNewChat, messages.length, id, mutate]);

  const handleSubmit = useCallback(
    (text: string) => {
      if (!text.trim() || isLoading) return;
      sendMessage({ text: text.trim() });
      setInput("");
    },
    [sendMessage, isLoading]
  );

  const handleSuggestion = useCallback(
    (prompt: string) => {
      sendMessage({ text: prompt });
    },
    [sendMessage]
  );

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden relative">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="max-w-2xl text-center space-y-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                <Terminal className="w-8 h-8 text-primary" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  Kwala AI
                </h2>
                <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                  Create, deploy, and monitor blockchain automations using
                  natural language.
                </p>
              </div>

              <SuggestedActions onSelect={handleSuggestion} />
            </div>
          </div>
        ) : (
          <Messages
            messages={messages}
            isLoading={isLoading}
            addToolOutput={addToolOutput}
          />
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-gradient-to-t from-background via-background to-transparent z-10">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
          />
        </div>
      </div>
    </div>
  );
}

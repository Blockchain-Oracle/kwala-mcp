"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "@ai-sdk/react";
import { Message } from "./message";
import { ToolCallLoader } from "./tool-call-loader";
import type { AddToolOutputHandler } from "./tool-result-renderer";

interface MessagesProps {
  messages: UIMessage[];
  isLoading: boolean;
  addToolOutput?: AddToolOutputHandler;
}

export function Messages({ messages, isLoading, addToolOutput }: MessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-full overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            addToolOutput={addToolOutput}
          />
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <ToolCallLoader />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

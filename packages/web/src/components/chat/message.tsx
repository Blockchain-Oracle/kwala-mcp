"use client";

import type { UIMessage } from "@ai-sdk/react";
import { isToolUIPart, getToolName } from "ai";
import { User, Loader2, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Markdown } from "./markdown";
import { ToolResultRenderer } from "./tool-result-renderer";

interface MessageProps {
  message: UIMessage;
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === "user";

  const renderParts = () => {
    return message.parts.map((part, index) => {
      // Text parts
      if (part.type === "text") {
        if (isUser) {
          return (
            <p
              key={index}
              className="whitespace-pre-wrap text-sm leading-relaxed"
            >
              {part.text}
            </p>
          );
        }
        return (
          <div
            key={index}
            className="prose dark:prose-invert prose-sm max-w-none"
          >
            <Markdown content={part.text} />
          </div>
        );
      }

      // Reasoning parts
      if (part.type === "reasoning") {
        return (
          <div
            key={index}
            className="my-2 p-3 rounded-md bg-muted/50 border border-dashed border-border text-muted-foreground text-xs font-mono"
          >
            <div className="flex items-center gap-2 mb-1 opacity-70">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Thinking...</span>
            </div>
            <p className="whitespace-pre-wrap opacity-80">{part.text}</p>
          </div>
        );
      }

      // AI SDK v6 tool parts
      if (isToolUIPart(part)) {
        const toolName = getToolName(part);
        const state = part.state;

        // Loading states
        if (state === "input-streaming" || state === "input-available") {
          return (
            <div
              key={index}
              className="my-3 rounded-md bg-muted border border-border overflow-hidden font-mono text-xs"
            >
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/80 border-b border-border">
                <Terminal className="w-3 h-3 text-primary" />
                <span className="font-semibold text-foreground">
                  Tool Call
                </span>
              </div>
              <div className="p-3 flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Executing:</span>
                  <span className="text-primary font-bold">{toolName}</span>
                </div>
              </div>
            </div>
          );
        }

        // Result available
        if (state === "output-available" && "output" in part) {
          return (
            <div key={index} className="my-3">
              <ToolResultRenderer toolName={toolName} result={part.output} />
            </div>
          );
        }

        // Error state
        if (state === "output-error" && "errorText" in part) {
          return (
            <div
              key={index}
              className="my-3 rounded-md bg-destructive/10 border border-destructive/30 p-3"
            >
              <div className="flex items-center gap-2 text-destructive">
                <Terminal className="w-4 h-4" />
                <span className="font-semibold">Error: {toolName}</span>
              </div>
              <p className="mt-2 text-sm text-destructive/80">
                {part.errorText}
              </p>
            </div>
          );
        }

        // Fallback
        return (
          <div
            key={index}
            className="my-2 p-3 rounded-md bg-muted border border-border"
          >
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <p className="text-xs font-mono text-muted-foreground">
                {toolName}: {state}
              </p>
            </div>
          </div>
        );
      }

      return null;
    });
  };

  return (
    <div
      className={cn(
        "group flex gap-4 md:gap-6 py-4 transition-colors hover:bg-muted/30 -mx-4 px-4 rounded-xl",
        isUser ? "bg-transparent" : ""
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm",
          isUser
            ? "bg-background text-foreground border-border"
            : "bg-primary/10 text-primary border-primary/20"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Terminal className="w-4 h-4" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">
            {isUser ? "You" : "Kwala AI"}
          </span>
          {!isUser && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary uppercase tracking-wider border border-primary/20">
              AI
            </span>
          )}
        </div>

        <div
          className={cn(
            "text-foreground",
            isUser ? "text-muted-foreground" : ""
          )}
        >
          {renderParts()}
        </div>
      </div>
    </div>
  );
}

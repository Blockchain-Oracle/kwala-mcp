"use client";

import { useRef, useCallback, type KeyboardEvent } from "react";
import { Send, Square, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (text: string) => void;
  isLoading: boolean;
  stop: () => void;
}

export function ChatInput({
  input,
  setInput,
  onSubmit,
  isLoading,
  stop,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    if (!input.trim() || isLoading) return;
    onSubmit(input.trim());

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, isLoading, onSubmit]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div
        className={cn(
          "relative flex items-start gap-3 p-4 rounded-2xl",
          "bg-card/80 backdrop-blur-sm",
          "border border-border shadow-xl",
          "transition-all duration-200",
          "focus-within:border-primary/60 focus-within:shadow-primary/10 focus-within:shadow-2xl"
        )}
      >
        <div className="shrink-0 mt-1">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              "bg-primary/10 border border-primary/20",
              isLoading && "animate-pulse"
            )}
          >
            <Terminal className="w-4 h-4 text-primary" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Create a workflow, check status, explore the network..."
            rows={1}
            className={cn(
              "w-full resize-none bg-transparent text-foreground",
              "placeholder:text-muted-foreground/60",
              "focus:outline-none min-h-[28px] max-h-[200px]",
              "text-[15px] leading-relaxed"
            )}
            disabled={isLoading}
          />

          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>Create - Deploy - Monitor - Explore</span>
            <span className="hidden sm:inline">Press Enter to send</span>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {isLoading ? (
            <button
              onClick={stop}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2 rounded-xl",
                "bg-foreground text-background font-medium text-sm",
                "hover:opacity-90 transition-opacity shadow-sm"
              )}
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2 rounded-xl",
                "font-medium text-sm transition-all duration-200 shadow-sm",
                input.trim()
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

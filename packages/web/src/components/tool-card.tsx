"use client";

import { useState } from "react";
import { Check, Wand2, Rocket, Search, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tool, ToolCategory } from "@/lib/tools";

const categoryIcon: Record<ToolCategory, React.ReactNode> = {
  "workflow-generation": <Wand2 className="size-3.5" />,
  deployment: <Rocket className="size-3.5" />,
  explorer: <Search className="size-3.5" />,
  account: <User className="size-3.5" />,
  system: <Settings className="size-3.5" />,
};

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tool.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback for non-secure contexts
    }
  };

  return (
    <button
      onClick={handleCopy}
      title={`Copy example prompt: ${tool.title}`}
      className={cn(
        "group w-full text-left flex items-start gap-3.5 px-4 py-3.5 rounded-xl border transition-all duration-200 cursor-pointer",
        copied
          ? "border-primary/50 bg-primary/5"
          : "border-border/70 bg-card hover:border-primary/30 hover:bg-card/80 active:scale-[0.99]"
      )}
    >
      <div className={cn(
        "size-8 shrink-0 flex items-center justify-center rounded-lg border transition-colors",
        copied
          ? "bg-primary/10 border-primary/30 text-primary"
          : "bg-muted border-border/60 text-muted-foreground group-hover:text-primary group-hover:border-primary/30"
      )}>
        {categoryIcon[tool.category]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-foreground truncate tracking-tight">
            {tool.title}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
          {tool.description}
        </p>
        <p className={cn(
          "text-xs font-mono mt-1.5 truncate transition-all duration-200",
          copied
            ? "text-primary"
            : "text-muted-foreground/50 group-hover:text-muted-foreground/70"
        )}>
          &ldquo;{tool.prompt}&rdquo;
        </p>
      </div>

      <div className={cn(
        "shrink-0 size-5 flex items-center justify-center rounded-md transition-all duration-200 mt-0.5",
        copied
          ? "opacity-100 text-primary"
          : "opacity-0 group-hover:opacity-60 text-muted-foreground"
      )}>
        <Check className="size-3.5" />
      </div>
    </button>
  );
}

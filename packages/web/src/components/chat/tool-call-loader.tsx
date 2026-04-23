"use client";

import { Loader2 } from "lucide-react";

export function ToolCallLoader() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted border border-border">
      <Loader2 className="w-4 h-4 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Thinking...</span>
    </div>
  );
}

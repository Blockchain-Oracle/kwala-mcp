"use client";

import { Terminal } from "lucide-react";
import { BaseCard } from "./base";

interface GenericResultCardProps {
  toolName: string;
  data: unknown;
}

function formatResult(data: unknown): string {
  if (!data) return "No data returned";
  if (typeof data === "string") return data;
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    if (d.content && Array.isArray(d.content)) {
      const text = (d.content as Array<Record<string, unknown>>).find(
        (c) => c.type === "text"
      );
      if (text?.text) return text.text as string;
    }
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }
  return String(data);
}

function formatToolName(name: string): string {
  return name
    .replace(/^kwala[-_]/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function GenericResultCard({ toolName, data }: GenericResultCardProps) {
  const text = formatResult(data);

  // Try to parse as JSON for pretty display
  let isJson = false;
  let prettyJson = "";
  try {
    const parsed = JSON.parse(text);
    prettyJson = JSON.stringify(parsed, null, 2);
    isJson = true;
  } catch {
    // not JSON
  }

  return (
    <BaseCard
      title={formatToolName(toolName)}
      icon={<Terminal className="w-4 h-4" />}
    >
      {isJson ? (
        <pre className="bg-background rounded-lg border border-border p-3 overflow-x-auto text-xs font-mono text-foreground leading-relaxed max-h-64 overflow-y-auto">
          {prettyJson}
        </pre>
      ) : (
        <p className="text-sm text-foreground whitespace-pre-wrap">{text}</p>
      )}
    </BaseCard>
  );
}

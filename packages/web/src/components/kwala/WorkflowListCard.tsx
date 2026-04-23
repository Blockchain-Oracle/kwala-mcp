"use client";

import { List, CircleDot } from "lucide-react";
import { BaseCard } from "./base";
import { ErrorCard } from "./base";
import { cn } from "@/lib/utils";

interface WorkflowListCardProps {
  data: unknown;
}

function parseResult(data: unknown): Record<string, unknown> {
  if (!data) return {};
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    if (d.content && Array.isArray(d.content)) {
      const text = (d.content as Array<Record<string, unknown>>).find(
        (c) => c.type === "text"
      );
      if (text?.text) {
        try {
          return JSON.parse(text.text as string);
        } catch {
          return { error: text.text as string };
        }
      }
    }
    return d;
  }
  return {};
}

export function WorkflowListCard({ data }: WorkflowListCardProps) {
  const result = parseResult(data);

  if (result.error) {
    return (
      <ErrorCard
        error={result.error as string}
        toolName="List Workflows"
      />
    );
  }

  const workflows = (result.workflows ?? []) as Array<Record<string, unknown>>;

  return (
    <BaseCard
      title={`Deployed Workflows (${result.count ?? workflows.length})`}
      icon={<List className="w-4 h-4" />}
    >
      {workflows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No workflows deployed yet
        </p>
      ) : (
        <div className="space-y-2">
          {workflows.map((wf, i) => {
            const status = (wf.status as string) ?? "unknown";
            const isActive = status === "active" || status === "deployed";
            return (
              <div
                key={i}
                className="rounded-lg border border-border bg-muted/20 p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CircleDot
                    className={cn(
                      "w-3 h-3 shrink-0",
                      isActive ? "text-green-400" : "text-muted-foreground"
                    )}
                  />
                  <span className="text-sm font-medium text-foreground truncate">
                    {(wf.name ?? wf.workflow_id ?? `Workflow ${i + 1}`) as string}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border",
                    isActive
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </BaseCard>
  );
}

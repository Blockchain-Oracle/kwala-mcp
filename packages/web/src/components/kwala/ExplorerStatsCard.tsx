"use client";

import { BarChart3 } from "lucide-react";
import { BaseCard } from "./base";
import { ErrorCard } from "./base";

interface ExplorerStatsCardProps {
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

export function ExplorerStatsCard({ data }: ExplorerStatsCardProps) {
  const result = parseResult(data);

  if (result.error) {
    return (
      <ErrorCard
        error={result.error as string}
        toolName="Explorer Stats"
      />
    );
  }

  const stats = [
    {
      label: "Actions Executed",
      value: result.total_actions_executed ?? "-",
      color: "text-primary",
    },
    {
      label: "Workflows Deployed",
      value: result.total_workflows_deployed ?? "-",
      color: "text-green-400",
    },
  ];

  return (
    <BaseCard
      title="Network Stats"
      icon={<BarChart3 className="w-4 h-4" />}
    >
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-muted/30 p-4 text-center"
          >
            <p className={`text-2xl font-bold ${stat.color}`}>
              {String(stat.value)}
            </p>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
      {result.filtered_by ? (
        <p className="text-xs text-muted-foreground mt-2">
          Filtered by: <span className="font-mono text-foreground">{String(result.filtered_by)}</span>
        </p>
      ) : null}
    </BaseCard>
  );
}

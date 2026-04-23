"use client";

import { Activity, CircleDot } from "lucide-react";
import { BaseCard, DataRow } from "./base";
import { ErrorCard } from "./base";
import { cn } from "@/lib/utils";

interface WorkflowStatusCardProps {
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

function StatusBadge({ status }: { status: string }) {
  const isActive =
    status === "active" || status === "deployed" || status === "running";
  const isInactive = status === "inactive" || status === "stopped";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider",
        isActive && "bg-green-500/10 text-green-400 border border-green-500/20",
        isInactive &&
          "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
        !isActive &&
          !isInactive &&
          "bg-muted text-muted-foreground border border-border"
      )}
    >
      <CircleDot className="w-3 h-3" />
      {status}
    </span>
  );
}

export function WorkflowStatusCard({ data }: WorkflowStatusCardProps) {
  const result = parseResult(data);

  if (result.error) {
    return (
      <ErrorCard
        error={result.error as string}
        toolName="Workflow Status"
      />
    );
  }

  const status = result.status as Record<string, unknown> | undefined;
  const chaincode = result.chaincode as Record<string, unknown> | undefined;

  return (
    <BaseCard
      title="Workflow Status"
      icon={<Activity className="w-4 h-4" />}
      variant={
        status?.status === "active" || status?.status === "deployed"
          ? "success"
          : "default"
      }
    >
      {result.workflow_id ? (
        <DataRow
          label="Workflow ID"
          value={result.workflow_id as string}
          mono
          copyable
        />
      ) : null}

      {status?.status ? (
        <div className="flex justify-between items-center py-1.5">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Status
          </span>
          <StatusBadge status={status.status as string} />
        </div>
      ) : null}

      {(chaincode?.address ?? chaincode?.chaincode_address) ? (
        <DataRow
          label="Chaincode Address"
          value={(chaincode.address ?? chaincode.chaincode_address) as string}
          mono
          copyable
        />
      ) : null}

      {status?.lastExecution ? (
        <DataRow
          label="Last Execution"
          value={status.lastExecution as string}
        />
      ) : null}
      {status?.executionCount !== undefined ? (
        <DataRow
          label="Executions"
          value={String(status.executionCount)}
          highlight
        />
      ) : null}
    </BaseCard>
  );
}

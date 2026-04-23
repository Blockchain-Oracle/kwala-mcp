"use client";

import { AlertTriangle, XCircle } from "lucide-react";
import { BaseCard } from "./BaseCard";

interface ErrorCardProps {
  error: string;
  toolName?: string;
}

export function ErrorCard({ error, toolName }: ErrorCardProps) {
  return (
    <BaseCard
      title={toolName ? `Error: ${toolName}` : "Execution Failed"}
      icon={<AlertTriangle className="w-4 h-4" />}
      variant="error"
    >
      <div className="flex items-start gap-3">
        <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-red-400">
            Operation could not be completed
          </p>
          <p className="text-xs text-red-400/80 font-mono bg-red-500/5 p-2 rounded border border-red-500/10">
            {error}
          </p>
        </div>
      </div>
    </BaseCard>
  );
}

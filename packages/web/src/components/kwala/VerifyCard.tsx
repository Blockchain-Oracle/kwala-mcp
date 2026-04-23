"use client";

import { ShieldCheck, ShieldAlert } from "lucide-react";
import { BaseCard, DataRow } from "./base";
import { ErrorCard } from "./base";

interface VerifyCardProps {
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

export function VerifyCard({ data }: VerifyCardProps) {
  const result = parseResult(data);

  if (result.error) {
    return (
      <ErrorCard error={result.error as string} toolName="Verify Workflow" />
    );
  }

  const isValid = result.valid === true || result.syntax_check === true;

  return (
    <BaseCard
      title={isValid ? "Verification Passed" : "Verification Failed"}
      icon={
        isValid ? (
          <ShieldCheck className="w-4 h-4" />
        ) : (
          <ShieldAlert className="w-4 h-4" />
        )
      }
      variant={isValid ? "success" : "error"}
    >
      {result.syntax_check !== undefined && (
        <DataRow
          label="Syntax Check"
          value={result.syntax_check ? "Passed" : "Failed"}
          highlight={!!result.syntax_check}
        />
      )}
      {result.schema_validation !== undefined && (
        <DataRow
          label="Schema Validation"
          value={result.schema_validation ? "Passed" : "Failed"}
          highlight={!!result.schema_validation}
        />
      )}
      {Array.isArray(result.warnings) ? (
        <div className="mt-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Warnings
          </p>
          {(result.warnings as string[]).map((w, i) => (
            <p
              key={i}
              className="text-xs text-yellow-400 font-mono bg-yellow-500/5 p-1.5 rounded mb-1"
            >
              {w}
            </p>
          ))}
        </div>
      ) : null}
      {Array.isArray(result.errors) ? (
        <div className="mt-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Errors
          </p>
          {(result.errors as string[]).map((e, i) => (
            <p
              key={i}
              className="text-xs text-red-400 font-mono bg-red-500/5 p-1.5 rounded mb-1"
            >
              {e}
            </p>
          ))}
        </div>
      ) : null}
    </BaseCard>
  );
}

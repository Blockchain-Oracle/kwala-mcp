"use client";

import { Coins } from "lucide-react";
import { BaseCard, DataRow } from "./base";
import { ErrorCard } from "./base";

interface CreditBalanceCardProps {
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

export function CreditBalanceCard({ data }: CreditBalanceCardProps) {
  const result = parseResult(data);

  if (result.error) {
    return (
      <ErrorCard error={result.error as string} toolName="Credit Balance" />
    );
  }

  return (
    <BaseCard title="Wallet Balance" icon={<Coins className="w-4 h-4" />}>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
          <p className="text-2xl font-bold text-primary">
            {result.gini_balance !== undefined ? String(result.gini_balance) : "-"}
          </p>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
            GINI
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {result.credits !== undefined ? String(result.credits) : "-"}
          </p>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
            Credits
          </p>
        </div>
      </div>

      {result.address ? (
        <DataRow label="Address" value={result.address as string} mono copyable />
      ) : null}

      {result.purchase_info ? (
        <p className="text-xs text-muted-foreground mt-2">
          {result.purchase_info as string}
        </p>
      ) : null}
    </BaseCard>
  );
}

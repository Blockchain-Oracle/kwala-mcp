"use client";

import { Globe, Network } from "lucide-react";
import { BaseCard } from "./base";
import { ErrorCard } from "./base";
import { cn } from "@/lib/utils";

interface Chain {
  id: number;
  name: string;
  symbol: string;
  network: string;
  tokens?: Array<{ symbol: string; address: string }>;
}

interface ChainSelectorCardProps {
  data: unknown;
}

function parseResult(data: unknown): Chain[] | { error: string } {
  if (!data) return [];
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
    if (Array.isArray(d)) return d as Chain[];
    return d as unknown as Chain[];
  }
  return [];
}

export function ChainSelectorCard({ data }: ChainSelectorCardProps) {
  const result = parseResult(data);

  if (!Array.isArray(result)) {
    return (
      <ErrorCard error={(result as { error: string }).error} toolName="List Chains" />
    );
  }

  const chains = result as Chain[];
  const mainnets = chains.filter((c) => c.network === "mainnet");
  const testnets = chains.filter((c) => c.network === "testnet");

  const renderChainGrid = (items: Chain[], label: string) => (
    <div>
      <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {label}
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {items.map((chain) => (
          <div
            key={chain.id}
            className={cn(
              "rounded-lg border border-border bg-muted/20 p-3 text-center",
              "hover:bg-muted/40 hover:border-primary/30 transition-all"
            )}
          >
            <Network className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-xs font-semibold text-foreground">{chain.name}</p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {chain.symbol} / {chain.id}
            </p>
            {chain.tokens && chain.tokens.length > 0 ? (
              <div className="flex gap-1 mt-1.5 justify-center flex-wrap">
                {chain.tokens.slice(0, 3).map((t) => (
                  <span
                    key={t.symbol}
                    className="text-[9px] px-1 py-0.5 rounded bg-primary/10 text-primary border border-primary/20"
                  >
                    {t.symbol}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <BaseCard
      title={`Supported Chains (${chains.length})`}
      icon={<Globe className="w-4 h-4" />}
    >
      <div className="space-y-4">
        {mainnets.length > 0 && renderChainGrid(mainnets, "Mainnets")}
        {testnets.length > 0 && renderChainGrid(testnets, "Testnets")}
      </div>
    </BaseCard>
  );
}

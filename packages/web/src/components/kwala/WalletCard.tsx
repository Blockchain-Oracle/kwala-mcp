"use client";

import { Wallet, Copy, Check } from "lucide-react";
import { BaseCard, DataRow } from "./base";
import { ErrorCard } from "./base";
import { useState } from "react";

interface WalletCardProps {
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

export function WalletCard({ data }: WalletCardProps) {
  const result = parseResult(data);
  const [copied, setCopied] = useState(false);

  if (result.error) {
    return <ErrorCard error={result.error as string} toolName="Wallet" />;
  }

  const address = result.address as string;
  const chain = result.kwala_chain as Record<string, unknown> | undefined;

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <BaseCard title="Kwala Wallet" icon={<Wallet className="w-4 h-4" />}>
      {address && (
        <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Address
            </span>
            <button
              onClick={handleCopy}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
          <p className="font-mono text-xs text-foreground break-all select-all">
            {address}
          </p>
        </div>
      )}

      {chain && (
        <div className="space-y-1 mt-2">
          <DataRow label="Chain ID" value={String(chain.chain_id)} highlight />
          <DataRow label="RPC" value={chain.rpc as string} mono />
        </div>
      )}

      {result.note ? (
        <p className="text-xs text-muted-foreground mt-2 italic">
          {result.note as string}
        </p>
      ) : null}
    </BaseCard>
  );
}

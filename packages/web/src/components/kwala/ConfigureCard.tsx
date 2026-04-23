"use client";

import { Settings, Check, X } from "lucide-react";
import { BaseCard, DataRow } from "./base";
import { ErrorCard } from "./base";

interface ConfigureCardProps {
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

function StatusIcon({ configured }: { configured: boolean }) {
  return configured ? (
    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
      <Check className="w-3 h-3 text-green-400" />
    </div>
  ) : (
    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
      <X className="w-3 h-3 text-muted-foreground" />
    </div>
  );
}

export function ConfigureCard({ data }: ConfigureCardProps) {
  const result = parseResult(data);

  if (result.error) {
    return (
      <ErrorCard error={result.error as string} toolName="Configure" />
    );
  }

  // "updated" is a string[] when settings were changed, absent when viewing
  const updatedList = result.updated as string[] | undefined;
  const isUpdated = Array.isArray(updatedList) && updatedList.length > 0;

  // Handle both formats:
  // 1. MCP format: { notifications: { configured: [...], telegram: {...} } }
  // 2. Direct format: { telegram: { chat_id, bot_token_set }, discord: null }
  const notifications = result.notifications as Record<string, unknown> | undefined;

  const hasTelegram = !!(notifications?.telegram) ||
    !!(result.telegram) ||
    ((notifications?.configured as string[]) ?? []).includes("Telegram");

  const hasDiscord = !!(notifications?.discord) ||
    !!(result.discord) ||
    ((notifications?.configured as string[]) ?? []).includes("Discord");

  return (
    <BaseCard
      title={isUpdated ? "Configuration Updated" : "Current Configuration"}
      icon={<Settings className="w-4 h-4" />}
      variant={isUpdated ? "success" : "default"}
    >
      {isUpdated && (
        <div className="mb-3 text-xs text-green-400">
          Updated: {updatedList.join(", ")}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <StatusIcon configured={hasTelegram} />
            <span className="text-sm text-foreground">Telegram</span>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {hasTelegram ? "Configured" : "Not set"}
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <StatusIcon configured={hasDiscord} />
            <span className="text-sm text-foreground">Discord</span>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {hasDiscord ? "Configured" : "Not set"}
          </span>
        </div>

        {result.default_chain ? (
          <DataRow
            label="Default Chain"
            value={result.default_chain as string}
            highlight
          />
        ) : null}
      </div>

      {result.wallet ? (
        <DataRow label="Wallet" value={result.wallet as string} mono />
      ) : null}

      {result.config_path ? (
        <p className="text-xs text-muted-foreground mt-3 font-mono">
          {result.config_path as string}
        </p>
      ) : null}

      {result.tip ? (
        <p className="text-xs text-muted-foreground mt-2 italic">
          {result.tip as string}
        </p>
      ) : null}

      {result.message ? (
        <p className="text-xs text-muted-foreground mt-2 italic">
          {result.message as string}
        </p>
      ) : null}
    </BaseCard>
  );
}

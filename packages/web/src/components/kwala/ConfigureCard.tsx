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

  const config = (result.config ?? result) as Record<string, unknown>;
  const updated = result.updated as boolean;

  return (
    <BaseCard
      title={updated ? "Configuration Updated" : "Current Configuration"}
      icon={<Settings className="w-4 h-4" />}
      variant={updated ? "success" : "default"}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <StatusIcon configured={!!config.telegram_bot_token} />
            <span className="text-sm text-foreground">Telegram</span>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {config.telegram_bot_token ? "Configured" : "Not set"}
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <StatusIcon configured={!!config.discord_webhook_url} />
            <span className="text-sm text-foreground">Discord</span>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {config.discord_webhook_url ? "Configured" : "Not set"}
          </span>
        </div>

        {config.default_chain ? (
          <DataRow
            label="Default Chain"
            value={config.default_chain as string}
            highlight
          />
        ) : null}
      </div>

      {result.config_path ? (
        <p className="text-xs text-muted-foreground mt-3 font-mono">
          {result.config_path as string}
        </p>
      ) : null}
    </BaseCard>
  );
}

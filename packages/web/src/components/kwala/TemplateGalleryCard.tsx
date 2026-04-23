"use client";

import { LayoutTemplate, Zap } from "lucide-react";
import { BaseCard } from "./base";
import { ErrorCard } from "./base";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  trigger_type: string;
  actions: string[];
  chains: string[];
}

interface TemplateGalleryCardProps {
  data: unknown;
}

function parseResult(
  data: unknown
): { count?: number; templates?: Template[]; error?: string } {
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
    return d as { count?: number; templates?: Template[] };
  }
  return {};
}

const categoryColors: Record<string, string> = {
  alerts: "bg-red-500/10 text-red-400 border-red-500/20",
  defi: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  nft: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  monitoring: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  notifications: "bg-green-500/10 text-green-400 border-green-500/20",
};

export function TemplateGalleryCard({ data }: TemplateGalleryCardProps) {
  const result = parseResult(data);

  if (result.error) {
    return (
      <ErrorCard error={result.error} toolName="List Templates" />
    );
  }

  const templates = result.templates ?? [];

  return (
    <BaseCard
      title={`Templates (${result.count ?? templates.length})`}
      icon={<LayoutTemplate className="w-4 h-4" />}
    >
      {templates.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No templates found
        </p>
      ) : (
        <div className="grid gap-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className="rounded-lg border border-border bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                    <h4 className="text-sm font-semibold text-foreground truncate">
                      {t.name}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {t.description}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                    categoryColors[t.category] ??
                      "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {t.category}
                </span>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-mono">
                  {t.trigger_type}
                </span>
                {t.chains?.slice(0, 3).map((chain) => (
                  <span
                    key={chain}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border font-mono"
                  >
                    {chain}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </BaseCard>
  );
}

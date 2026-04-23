"use client";

import { FileCode, Copy, Check, Rocket } from "lucide-react";
import { BaseCard, DataRow } from "./base";
import { ErrorCard } from "./base";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AutomationResult {
  yaml?: string;
  name?: string;
  description?: string;
  trigger_type?: string;
  chain?: string;
  error?: string;
}

interface AutomationCardProps {
  data: unknown;
  onDeploy?: (yaml: string, name: string) => void;
}

function parseResult(data: unknown): AutomationResult {
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
    return d as AutomationResult;
  }
  return {};
}

export function AutomationCard({ data, onDeploy }: AutomationCardProps) {
  const result = parseResult(data);
  const [copied, setCopied] = useState(false);

  if (result.error) {
    return (
      <ErrorCard error={result.error as string} toolName="Create Automation" />
    );
  }

  const yaml = result.yaml;
  const name = result.name;
  const description = result.description;

  const handleCopy = () => {
    if (!yaml) return;
    navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDeployable = typeof onDeploy === "function" && yaml && name;

  return (
    <BaseCard
      title="Automation Created"
      icon={<FileCode className="w-4 h-4" />}
      variant="success"
    >
      {name && <DataRow label="Name" value={name} highlight />}
      {description && <DataRow label="Description" value={description} />}

      {yaml && (
        <div className="relative mt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Kwalang YAML
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-green-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
          </div>
          <pre className="bg-background rounded-lg border border-border p-3 overflow-x-auto text-xs font-mono text-foreground leading-relaxed max-h-64 overflow-y-auto">
            {yaml}
          </pre>
        </div>
      )}

      {result.trigger_type ? (
        <DataRow label="Trigger" value={result.trigger_type} />
      ) : null}
      {result.chain ? (
        <DataRow label="Chain" value={result.chain} />
      ) : null}

      {isDeployable && (
        <button
          type="button"
          onClick={() => onDeploy(yaml, name)}
          className={cn(
            "w-full flex items-center justify-center gap-2 mt-3",
            "py-2.5 px-4 rounded-lg font-medium text-sm",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90 transition-all",
            "active:scale-[0.98]"
          )}
        >
          <Rocket className="w-4 h-4" />
          Deploy This Workflow
        </button>
      )}
    </BaseCard>
  );
}

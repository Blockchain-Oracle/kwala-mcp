"use client";

import { useState, useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface McpOption {
  client: string;
  command: string;
  hue: number;
}

const MCP_OPTIONS: McpOption[] = [
  { client: "Claude Code", command: "claude mcp add kwala npx @kwala-dev/mcp", hue: 280 },
  { client: "Cursor", command: '// .cursor/mcp.json -- "kwala": { "command": "npx", "args": ["-y", "@kwala-dev/mcp"] }', hue: 260 },
  { client: "Claude Desktop", command: '// claude_desktop_config.json -- "kwala": { "command": "npx", "args": ["-y", "@kwala-dev/mcp"] }', hue: 220 },
  { client: "Windsurf", command: '// ~/.codeium/windsurf/mcp_config.json -- "kwala": { "command": "npx", "args": ["-y", "@kwala-dev/mcp"] }', hue: 290 },
  { client: "VS Code Copilot", command: '// .vscode/mcp.json -- "servers": { "kwala": { "type": "stdio", "command": "npx", "args": ["-y", "@kwala-dev/mcp"] } }', hue: 180 },
  { client: "Gemini CLI", command: "gemini mcp add kwala npx -y @kwala-dev/mcp", hue: 30 },
];

const ROTATE_MS = 3500;

interface RotatingCardProps<T extends { command: string; hue: number }> {
  eyebrow: string;
  title: string;
  subtitle: string;
  options: T[];
  renderLabel: (opt: T) => string;
  footer?: ReactNode;
}

function RotatingCard<T extends { command: string; hue: number }>({
  eyebrow,
  title,
  subtitle,
  options,
  renderLabel,
  footer,
}: RotatingCardProps<T>) {
  const [index, setIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % options.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, options.length]);

  const current = options[index];

  async function handleCopy() {
    await navigator.clipboard.writeText(current.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="flex flex-col lg:h-full gap-5 lg:gap-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div>
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground/60">
          {eyebrow}
        </span>
        <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mt-1">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          {subtitle}
        </p>
      </div>

      <div className="hidden lg:block lg:flex-1 lg:min-h-6" />

      <div className="flex items-center gap-2 h-4 mb-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={renderLabel(current)}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <motion.span
              className="size-1.5 rounded-full shrink-0"
              animate={{
                backgroundColor: `oklch(0.7 0.15 ${current.hue})`,
                boxShadow: `0 0 8px oklch(0.7 0.15 ${current.hue} / 0.6)`,
              }}
              transition={{ duration: 0.6 }}
            />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
              {renderLabel(current)}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.div
        animate={{
          borderColor: `oklch(0.7 0.08 ${current.hue} / 0.4)`,
        }}
        transition={{ duration: 0.8 }}
        className="relative flex items-start lg:items-center justify-between gap-2 sm:gap-3 rounded-xl border bg-card px-3 sm:px-5 py-3 sm:py-4 overflow-hidden min-w-0"
      >
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: `linear-gradient(90deg, oklch(0.7 0.12 ${current.hue} / 0.05), transparent 60%)`,
          }}
          transition={{ duration: 1.2 }}
        />

        <div className="flex-1 min-w-0 relative z-10">
          <AnimatePresence mode="wait">
            <motion.code
              key={current.command}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="font-mono text-[11px] sm:text-sm text-foreground select-all block break-all lg:break-normal lg:truncate leading-snug"
            >
              {current.command}
            </motion.code>
          </AnimatePresence>
        </div>

        <button
          onClick={handleCopy}
          className={cn(
            "relative z-10 shrink-0 flex items-center justify-center gap-1.5 font-mono text-[10px] sm:text-[11px] tracking-wider uppercase size-8 sm:size-auto sm:px-2.5 sm:py-1 rounded-md transition-all",
            copied
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
          )}
          aria-label={copied ? "Copied!" : "Copy command"}
        >
          {copied ? (
            <>
              <Check className="size-3.5" />
              <span className="hidden sm:inline">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>
      </motion.div>

      <div className="flex items-center gap-0.5 mt-3 -mx-2">
        {options.map((opt, i) => (
          <button
            key={renderLabel(opt)}
            onClick={() => {
              setIndex(i);
              setPaused(true);
            }}
            title={renderLabel(opt)}
            aria-label={`Jump to ${renderLabel(opt)}`}
            className="group p-2 cursor-pointer"
          >
            <span
              className={cn(
                "block h-1 rounded-full transition-all",
                i === index
                  ? "w-6 bg-foreground"
                  : "w-1.5 bg-muted-foreground/40 group-hover:bg-muted-foreground/80 group-hover:w-3",
              )}
            />
          </button>
        ))}
      </div>

      {footer && <div className="mt-auto pt-2">{footer}</div>}
    </div>
  );
}

export function McpInstall() {
  return (
    <RotatingCard
      eyebrow="MCP Server"
      title="One command, every client."
      subtitle="kwala-mcp runs in 6+ AI clients. Pick yours -- config auto-rotates."
      options={MCP_OPTIONS}
      renderLabel={(o) => o.client}
    />
  );
}

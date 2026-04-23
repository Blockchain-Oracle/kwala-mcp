"use client";

import { useState } from "react";
import { Check, Copy, Download, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const INSTALL_METHODS = [
  {
    id: "prompt",
    label: "Paste into any agent",
    description:
      "The simplest install — works in any agent that can fetch URLs.",
    command:
      "Read https://github.com/Blockchain-Oracle/kwala-mcp/blob/main/packages/skills/kwala/SKILL.md and follow the instructions to install the Kwala AI skill.",
  },
  {
    id: "cli",
    label: "CLI install",
    description:
      "Uses the vercel-labs/skills CLI to install to the right path for your agents.",
    command:
      "pnpm dlx skills add github:Blockchain-Oracle/kwala-mcp --skill kwala",
  },
  {
    id: "manual",
    label: "Manual — download and place",
    description:
      "Download SKILL.md below and save it to your agent's skills directory.",
    command: null,
  },
];

const CLIENT_PATHS = [
  { client: "Claude Code", path: "~/.claude/skills/kwala/SKILL.md" },
  { client: "Cursor (2.4+)", path: "~/.cursor/skills/kwala/SKILL.md" },
  { client: "Windsurf", path: "~/.codeium/windsurf/skills/kwala/SKILL.md" },
  { client: "VS Code Copilot", path: "~/.copilot/skills/kwala/SKILL.md" },
  { client: "Gemini CLI", path: "~/.gemini/skills/kwala/SKILL.md" },
  { client: "Cline (3.48+)", path: "~/.cline/skills/kwala/SKILL.md" },
  { client: "Goose", path: "~/.config/agents/skills/kwala/SKILL.md" },
];

interface SkillContentProps {
  content: string;
}

export function SkillContent({ content }: SkillContentProps) {
  const [copiedMethod, setCopiedMethod] = useState<string | null>(null);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [contentCopied, setContentCopied] = useState(false);
  const [pathsOpen, setPathsOpen] = useState(false);
  const [fullOpen, setFullOpen] = useState(false);

  const lineCount = content.split("\n").length;

  async function copyText(id: string, text: string, kind: "method" | "path") {
    await navigator.clipboard.writeText(text);
    if (kind === "method") {
      setCopiedMethod(id);
      setTimeout(() => setCopiedMethod(null), 2000);
    } else {
      setCopiedPath(id);
      setTimeout(() => setCopiedPath(null), 2000);
    }
  }

  async function copyContent() {
    await navigator.clipboard.writeText(content);
    setContentCopied(true);
    setTimeout(() => setContentCopied(false), 2000);
  }

  function downloadContent() {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SKILL.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-12">
      <section>
        <div className="mb-6">
          <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
            Three ways to install
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Pick your flavor.
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            The Kwala AI skill is a plain SKILL.md file — the cross-client Agent
            Skills format. It works natively in Claude Code, Cursor 2.4+,
            Windsurf, VS Code Copilot, Gemini CLI, and Cline.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {INSTALL_METHODS.map((method) => (
            <div
              key={method.id}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {method.label}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {method.description}
                  </p>
                </div>
                {method.command && (
                  <button
                    onClick={() =>
                      copyText(method.id, method.command!, "method")
                    }
                    className={cn(
                      "shrink-0 flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-md transition-all",
                      copiedMethod === method.id
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    {copiedMethod === method.id ? (
                      <>
                        <Check className="size-3" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" /> Copy
                      </>
                    )}
                  </button>
                )}
              </div>
              {method.command ? (
                <code className="block font-mono text-xs text-foreground/85 bg-muted/40 rounded-md px-3 py-2 overflow-x-auto">
                  {method.command}
                </code>
              ) : (
                <div>
                  <button
                    onClick={() => setPathsOpen((v) => !v)}
                    className="w-full flex items-center gap-2 font-mono text-[10px] tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    <ChevronRight
                      className={cn(
                        "size-3 transition-transform",
                        pathsOpen && "rotate-90"
                      )}
                    />
                    Show paths for {CLIENT_PATHS.length} clients
                  </button>
                  {pathsOpen && (
                    <div className="mt-2 space-y-1.5">
                      {CLIENT_PATHS.map((cp) => (
                        <div
                          key={cp.client}
                          className="flex items-center justify-between gap-3 px-3 py-1.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-mono text-[10px] tracking-wide text-muted-foreground shrink-0 w-32">
                              {cp.client}
                            </span>
                            <code className="font-mono text-[11px] text-foreground/80 truncate">
                              {cp.path}
                            </code>
                          </div>
                          <button
                            onClick={() =>
                              copyText(cp.client, cp.path, "path")
                            }
                            className={cn(
                              "shrink-0 p-1 rounded transition-colors",
                              copiedPath === cp.client
                                ? "text-primary"
                                : "text-muted-foreground/60 hover:text-foreground"
                            )}
                          >
                            {copiedPath === cp.client ? (
                              <Check className="size-3" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
              Full skill content
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              SKILL.md
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              The complete file ({lineCount} lines). Copy, download, or expand
              to preview.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={downloadContent}
              className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
            >
              <Download className="size-3" /> Download
            </button>
            <button
              onClick={copyContent}
              className={cn(
                "flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-md border transition-all",
                contentCopied
                  ? "border-primary/50 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              {contentCopied ? (
                <>
                  <Check className="size-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-3" /> Copy All
                </>
              )}
            </button>
          </div>
        </div>

        <button
          onClick={() => setFullOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-5 py-3.5 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <ChevronRight
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                fullOpen && "rotate-90"
              )}
            />
            <span className="font-mono text-xs text-foreground">
              {fullOpen ? "Hide" : "Preview"} SKILL.md
            </span>
          </div>
          <span className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground">
            {lineCount} lines
          </span>
        </button>

        {fullOpen && (
          <pre className="mt-3 rounded-xl border border-border bg-card p-5 overflow-x-auto text-xs font-mono text-foreground/85 leading-relaxed whitespace-pre-wrap max-h-[70vh] overflow-y-auto">
            {content}
          </pre>
        )}
      </section>
    </div>
  );
}

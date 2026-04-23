"use client";

import { ArrowRight, ExternalLink, GitFork } from "lucide-react";
import { McpInstall } from "@/components/install-command";
import { SetupSteps } from "@/components/setup-steps";
import { ToolCard } from "@/components/tool-card";
import { WorkflowExamples } from "@/components/workflow-examples";
import { ChainGrid } from "@/components/chain-grid";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { tools, categoryLabel, type ToolCategory } from "@/lib/tools";

const CATEGORIES: ToolCategory[] = [
  "workflow-generation",
  "deployment",
  "explorer",
  "account",
  "system",
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">

      {/* ========== HERO ========== */}
      <section className="relative w-full bg-background overflow-hidden">
        {/* Grid dot background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, oklch(0.72 0.14 290 / 0.06) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Purple radial glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-start">
          <div className="ml-[10%] w-[500px] h-[320px] rounded-full bg-primary/5 blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* Left column */}
            <div className="flex flex-col gap-6">
              <BlurFade delay={0}>
                <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
                  <span className="size-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                  Kwala Network &middot; MCP Server
                </span>
              </BlurFade>

              <BlurFade delay={0.06}>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tighter leading-[0.92] text-foreground">
                  AI-Powered{" "}
                  <span className="text-primary">Blockchain Automation</span>
                </h1>
              </BlurFade>

              <BlurFade delay={0.12}>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  18 tools. Create, verify, deploy, and monitor Kwalang YAML workflows
                  from natural language -- for Claude, Cursor, and any MCP host.
                </p>
              </BlurFade>

              <BlurFade delay={0.18} className="w-full">
                <McpInstall />
              </BlurFade>

              <BlurFade delay={0.22}>
                <div className="flex flex-wrap items-center gap-3">
                  <a href="#tools">
                    <Button className="rounded-full px-6 gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                      Explore Tools
                      <ArrowRight className="size-4" />
                    </Button>
                  </a>
                  <a href="#how-it-works">
                    <Button
                      variant="outline"
                      className="rounded-full px-6 border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
                    >
                      How It Works
                    </Button>
                  </a>
                </div>
              </BlurFade>
            </div>

            {/* Right column: terminal preview + stats */}
            <BlurFade delay={0.28}>
              <div className="flex flex-col gap-4">
                {/* Terminal window */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                    <span className="size-2.5 rounded-full bg-red-400/70" />
                    <span className="size-2.5 rounded-full bg-yellow-400/70" />
                    <span className="size-2.5 rounded-full bg-green-400/70" />
                    <span className="ml-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                      Claude &middot; kwala-mcp
                    </span>
                  </div>
                  <div className="px-5 py-5 font-mono text-[13px] space-y-3">
                    <div className="flex gap-2">
                      <span className="text-primary shrink-0">&rsaquo;</span>
                      <span className="text-foreground">Create a workflow that alerts me when ETH drops below $2000</span>
                    </div>
                    <div className="flex gap-2 text-muted-foreground">
                      <span className="text-primary/60 shrink-0">&check;</span>
                      <span>
                        Generated <span className="text-foreground font-semibold">ETHPriceAlert.yaml</span>
                        {" -- "}
                        trigger: oracle_price, action: Telegram POST
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-primary shrink-0">&rsaquo;</span>
                      <span className="text-foreground">Deploy it to Kwala Network</span>
                    </div>
                    <div className="flex gap-2 text-muted-foreground">
                      <span className="text-primary/60 shrink-0">&check;</span>
                      <span>
                        Deployed to <span className="text-foreground font-semibold">chain 1905</span>
                        {" -- "}
                        status: <span className="text-green-400">active</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary shrink-0">&rsaquo;</span>
                      <span className="text-muted-foreground/60 animate-pulse">_</span>
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Tools", value: "18" },
                    { label: "Categories", value: "5" },
                    { label: "Chains", value: "12" },
                    { label: "Install", value: "1 cmd" },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-border bg-card/50 px-3 py-3 flex flex-col items-center gap-0.5"
                    >
                      <span className="text-xl font-bold text-foreground tracking-tight">
                        {value}
                      </span>
                      <span className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </BlurFade>

          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section
        id="how-it-works"
        className="w-full bg-secondary border-y border-border"
      >
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="mb-12">
            <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
              How it works
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
              Three steps to automate.
            </h2>
          </div>
          <SetupSteps />
        </div>
      </section>

      {/* ========== TOOL CATALOG ========== */}
      <section id="tools" className="w-full bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="mb-10">
            <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
              Tool catalog
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
              18 tools, 5 categories.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl">
              Click any card to copy an example prompt you can paste directly into Claude or any MCP-compatible AI host.
            </p>
          </div>

          {CATEGORIES.map((cat) => {
            const catTools = tools.filter((t) => t.category === cat);
            return (
              <div key={cat} className="mb-10 last:mb-0">
                <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">
                  {categoryLabel[cat]}
                  <span className="ml-2 text-muted-foreground/40">({catTools.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catTools.map((tool, i) => (
                    <BlurFade key={tool.name} delay={0.03 * i} inView>
                      <ToolCard tool={tool} />
                    </BlurFade>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========== SUPPORTED CHAINS ========== */}
      <section className="w-full bg-secondary border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="mb-10">
            <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
              Multi-chain
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
              6 mainnets + 6 testnets.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl">
              Fuzzy chain name resolution -- say &quot;Base&quot; and kwala-mcp resolves it to chain ID 8453 automatically.
            </p>
          </div>
          <ChainGrid />
        </div>
      </section>

      {/* ========== EXAMPLE WORKFLOWS ========== */}
      <section className="w-full bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="mb-10">
            <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
              Examples
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
              Real Kwalang workflows.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl">
              These YAML files are generated by AI and deployed on-chain to Kwala Network.
              Browse templates or create your own from natural language.
            </p>
          </div>
          <WorkflowExamples />
        </div>
      </section>

      {/* ========== INSTALLATION ========== */}
      <section id="install" className="w-full bg-secondary border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="mb-12">
            <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
              Install
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
              One command, everywhere.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl">
              Install the MCP server in your AI client of choice. Zero config, zero auth for read-only tools.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 lg:p-8">
            <McpInstall />
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="w-full bg-background border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span className="font-mono text-xs font-bold text-foreground tracking-tight">
              kwala-mcp
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              AI-powered blockchain automation
            </span>
            <span className="font-mono text-[10px] text-muted-foreground/60">
              Kwala Network x Schulltech Hackathon &middot; MIT License
            </span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a
              href="#tools"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Tools
            </a>
            <a
              href="#how-it-works"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </a>
            <a
              href="https://kwala.network"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Kwala Network <ExternalLink className="size-3" />
            </a>
            <a
              href="https://github.com/Blockchain-Oracle/kwala-mcp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub <GitFork className="size-3" />
            </a>
          </nav>
        </div>
      </footer>

    </main>
  );
}

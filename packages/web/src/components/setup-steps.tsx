import { Terminal, MessageSquare, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    step: "01",
    icon: MessageSquare,
    title: "Speak",
    description: "Describe your automation in plain English.",
    detail:
      "Tell your AI agent what you want to automate: price alerts, transfer monitoring, auto top-ups, NFT rewards -- anything on-chain.",
  },
  {
    step: "02",
    icon: Terminal,
    title: "Generate",
    description: "AI builds a Kwalang YAML workflow.",
    detail:
      "The agent uses kwala-mcp tools to generate a validated Kwalang YAML file with triggers, actions, and execution logic -- ready for deployment.",
    code: "kwala create-automation --prompt \"Alert me when ETH < $2000\"",
  },
  {
    step: "03",
    icon: Rocket,
    title: "Deploy",
    description: "One command deploys to Kwala Network.",
    detail:
      "Verify, save, deploy, and activate your workflow on-chain (Kwala chain 1905). It runs autonomously -- monitoring events and executing actions 24/7.",
    code: "kwala deploy-workflow --file my-alert.yaml",
  },
];

export function SetupSteps() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3">
      {steps.map(({ step, icon: Icon, title, description, detail, code }, index) => (
        <div
          key={step}
          className={cn(
            "flex flex-col gap-5 py-8",
            index < 2 && "border-b border-border sm:border-b-0",
            index > 0 && "sm:border-l sm:border-border sm:pl-10",
            index < 2 && "sm:pr-10",
          )}
        >
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-muted-foreground/40 tracking-widest select-none">
              {step}
            </span>
            <div className="size-9 flex items-center justify-center rounded-xl bg-background text-primary border border-border shadow-sm">
              <Icon className="size-4" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold text-foreground tracking-tight">
              {title}
            </h3>
            <p className="text-sm font-semibold text-muted-foreground leading-snug">
              {description}
            </p>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground/70">
            {detail}
          </p>

          {code && (
            <code className="font-mono text-xs text-primary/80 bg-primary/10 border border-primary/20 px-3 py-2 rounded-lg break-all">
              {code}
            </code>
          )}
        </div>
      ))}
    </div>
  );
}

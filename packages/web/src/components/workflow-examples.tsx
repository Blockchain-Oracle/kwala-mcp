"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

const examples = [
  {
    title: "Price Alert",
    description: "Get notified when SOL drops below $150 via Telegram.",
    yaml: `Name: SOLPriceDropAlert
Trigger:
  TriggerPrice: 150.0
  ExecuteAfter: "oracle_price"
  RepeatEvery: "oracle_price"
  ExpiresIn: 2592000
Actions:
  - Name: AlertTelegram
    Type: post
    APIEndpoint: "https://api.telegram.org/..."
    APIPayload:
      chat_id: "<CHAT_ID>"
      text: "SOL has dropped below $150!"
    RetriesUntilSuccess: 3
Execution:
  Mode: sequential`,
  },
  {
    title: "Transfer Monitor",
    description: "Watch USDC transfers on Ethereum and alert in real-time.",
    yaml: `Name: TokenTransferAlert
Trigger:
  TriggerSourceContract: "0xA0b8...eB48"
  TriggerChainID: 1
  TriggerEventName: "Transfer(address,address,uint256)"
  RepeatEvery: "event"
  ExecuteAfter: "event"
Actions:
  - Name: SendTelegramAlert
    Type: post
    APIEndpoint: "https://api.telegram.org/..."
    APIPayload:
      chat_id: "<CHAT_ID>"
      text: "USDC Transfer detected"
    RetriesUntilSuccess: 3
Execution:
  Mode: sequential`,
  },
  {
    title: "Auto Top-Up",
    description: "Automatically send USDC when a wallet balance drops on Base.",
    yaml: `Name: AutoTopUpWallet
Trigger:
  TriggerSourceContract: "0xBalanceChecker"
  TriggerChainID: 8453
  TriggerEventName: "LowBalance(address,uint256)"
  RepeatEvery: "event"
  ExecuteAfter: "event"
Actions:
  - Name: TransferUSDC
    Type: call
    TargetContract: "0xUSDCContract"
    TargetFunction: "function transfer(...)"
    TargetParams:
      - "re.event(0)"
      - "1000000"
    ChainID: 8453
    RetriesUntilSuccess: 3
Execution:
  Mode: sequential`,
  },
];

export function WorkflowExamples() {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(examples[active].yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tab buttons */}
      <div className="flex flex-wrap gap-2">
        {examples.map((ex, i) => (
          <button
            key={ex.title}
            onClick={() => setActive(i)}
            className={cn(
              "px-4 py-2 rounded-lg font-mono text-xs tracking-wider uppercase transition-all",
              i === active
                ? "bg-primary/10 text-primary border border-primary/30"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/20",
            )}
          >
            {ex.title}
          </button>
        ))}
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground">
        {examples[active].description}
      </p>

      {/* YAML block */}
      <div className="relative rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-red-400/70" />
            <span className="size-2.5 rounded-full bg-yellow-400/70" />
            <span className="size-2.5 rounded-full bg-green-400/70" />
            <span className="ml-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              {examples[active].title.toLowerCase().replace(/ /g, "-")}.yaml
            </span>
          </div>
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-md transition-all",
              copied
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="px-5 py-5 font-mono text-[13px] text-foreground/90 overflow-x-auto leading-relaxed">
          {examples[active].yaml}
        </pre>
      </div>
    </div>
  );
}

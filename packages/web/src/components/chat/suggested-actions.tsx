"use client";

import { useState, memo, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Wallet,
  Zap,
  BarChart3,
  Globe,
  Settings,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface SuggestedActionsProps {
  onSelect: (prompt: string) => void;
}

interface Category {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  actions: { title: string; description: string; prompt: string }[];
}

const CATEGORIES: Category[] = [
  {
    id: "create",
    label: "Create",
    icon: Zap,
    actions: [
      {
        title: "Price Alert",
        description: "Alert when ETH drops below $2000",
        prompt:
          "Alert me on Telegram when ETH drops below $2000. Auto-generate a unique workflow name and include the price threshold in the notification message.",
      },
      {
        title: "USDC Monitor",
        description: "Watch USDC transfers on Base Sepolia",
        prompt:
          "Monitor USDC Transfer events on Base Sepolia and notify me on Telegram. Include the sender address, recipient, and amount in the notification.",
      },
      {
        title: "Wallet Tracker",
        description: "Track any wallet for activity",
        prompt:
          "Track wallet 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18 on Polygon for all activity and send me a Telegram alert with the transaction details.",
      },
    ],
  },
  {
    id: "deploy",
    label: "Deploy",
    icon: BarChart3,
    actions: [
      {
        title: "Verify & Deploy",
        description: "Deploy a workflow on-chain",
        prompt: "List my workflow templates and help me deploy one",
      },
      {
        title: "My Workflows",
        description: "View deployed workflows",
        prompt: "Show me all my deployed workflows and their status",
      },
      {
        title: "Network Stats",
        description: "Kwala network activity",
        prompt: "Show me the Kwala network explorer stats — total actions and deployed workflows",
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    icon: Wallet,
    actions: [
      {
        title: "My Wallet",
        description: "Show connected wallet info",
        prompt: "Show my connected wallet address and Kwala credit balance",
      },
      {
        title: "Supported Chains",
        description: "View all chains and tokens",
        prompt: "List all supported blockchain networks with their tokens",
      },
      {
        title: "Browse Templates",
        description: "Pre-built workflow templates",
        prompt: "Show me available workflow templates I can use",
      },
    ],
  },
  {
    id: "setup",
    label: "Setup",
    icon: Settings,
    actions: [
      {
        title: "Setup Telegram",
        description: "Configure Telegram notifications",
        prompt:
          "I want to set up my Telegram notifications. Help me configure it.",
      },
      {
        title: "View Config",
        description: "Check notification settings",
        prompt: "Show me my current notification configuration",
      },
      {
        title: "Quick Start",
        description: "Set up everything at once",
        prompt:
          "Show my wallet, check my balance, and show my notification config",
      },
    ],
  },
];

const ActionCard = memo(function ActionCard({
  action,
  onSelect,
}: {
  action: Category["actions"][number];
  onSelect: (prompt: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(action.prompt)}
      className="group relative flex items-center gap-4 w-full min-w-[280px] max-w-[320px] p-4 rounded-xl bg-card border border-border text-left transition-all duration-200 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-primary" />
      <div className="flex-1 pl-2">
        <h4 className="font-medium text-foreground mb-0.5">{action.title}</h4>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {action.description}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
    </button>
  );
});

export function SuggestedActions({ onSelect }: SuggestedActionsProps) {
  const [activeCategory, setActiveCategory] = useState<string>(
    CATEGORIES[0].id
  );

  const handleSelect = useCallback(
    (prompt: string) => {
      onSelect(prompt);
    },
    [onSelect]
  );

  const currentCategory =
    CATEGORIES.find((c) => c.id === activeCategory) ?? CATEGORIES[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="w-4 h-4 text-primary" />
        <span>Try asking about...</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all",
                "hover:bg-muted hover:border-primary/30",
                isActive
                  ? "bg-primary/10 text-primary border-primary"
                  : "border-border text-muted-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span>{category.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {currentCategory.actions.map((action) => (
          <ActionCard
            key={action.title}
            action={action}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}

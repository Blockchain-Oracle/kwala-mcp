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
          "Create a workflow that alerts me via Telegram when ETH drops below $2000 on Ethereum",
      },
      {
        title: "Transfer Monitor",
        description: "Watch USDC transfers on Base",
        prompt:
          "Create a workflow that monitors large USDC transfers (>$10k) on Base and sends a Discord notification",
      },
      {
        title: "NFT Activity",
        description: "Track NFT mints on a contract",
        prompt:
          "Create a workflow to monitor NFT mint events on a contract and send me alerts",
      },
    ],
  },
  {
    id: "deploy",
    label: "Deploy",
    icon: BarChart3,
    actions: [
      {
        title: "Deploy Workflow",
        description: "Deploy a workflow to Kwala Network",
        prompt:
          "Help me deploy a workflow to the Kwala Network. What do I need to get started?",
      },
      {
        title: "Check Status",
        description: "View workflow deployment status",
        prompt: "Show me the status of my deployed workflows",
      },
      {
        title: "Network Stats",
        description: "Explore Kwala network statistics",
        prompt: "Show me the Kwala network explorer stats",
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
        description: "Show your Kwala wallet",
        prompt: "Show me my Kwala wallet address",
      },
      {
        title: "Credit Balance",
        description: "Check your Kwala credits",
        prompt: "What is my Kwala credit balance?",
      },
      {
        title: "Configure Notifications",
        description: "Set up Telegram or Discord",
        prompt:
          "Show me my current notification configuration for Telegram and Discord",
      },
    ],
  },
  {
    id: "explore",
    label: "Explore",
    icon: Globe,
    actions: [
      {
        title: "Supported Chains",
        description: "View all supported blockchains",
        prompt: "What blockchain networks does Kwala support?",
      },
      {
        title: "Browse Templates",
        description: "Pre-built workflow templates",
        prompt: "Show me available workflow templates",
      },
      {
        title: "Available Tools",
        description: "List all Kwala tools",
        prompt: "What tools are available in Kwala?",
      },
    ],
  },
  {
    id: "setup",
    label: "Setup",
    icon: Settings,
    actions: [
      {
        title: "Getting Started",
        description: "New to Kwala? Start here",
        prompt:
          "I'm new to Kwala. Help me set up my wallet and configure notifications so I can start creating automations.",
      },
      {
        title: "Login",
        description: "Authenticate with Kwala",
        prompt: "Help me log in to the Kwala API",
      },
      {
        title: "Full Setup",
        description: "Configure everything at once",
        prompt:
          "Set up my Kwala account: create wallet, check balance, and show my notification config",
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

"use client";

import {
  DeploymentProgressCard,
  WorkflowStatusCard,
  ExplorerStatsCard,
  WalletCard,
  AutomationCard,
  TemplateGalleryCard,
  ChainSelectorCard,
  ConfigureCard,
  CreditBalanceCard,
  VerifyCard,
  WorkflowListCard,
  GenericResultCard,
  ErrorCard,
} from "@/components/kwala";

interface ToolResultRendererProps {
  toolName: string;
  result: unknown;
}

export function ToolResultRenderer({ toolName, result }: ToolResultRendererProps) {
  if (result === null || result === undefined) {
    return (
      <ErrorCard
        error="Tool result not available."
        toolName={toolName}
      />
    );
  }

  switch (toolName) {
    // Workflow Generation
    case "kwala-create-automation":
      return <AutomationCard data={result} />;
    case "kwala-explain-yaml":
      return <GenericResultCard toolName={toolName} data={result} />;
    case "kwala-list-templates":
      return <TemplateGalleryCard data={result} />;
    case "kwala-build-trigger":
      return <GenericResultCard toolName={toolName} data={result} />;
    case "kwala-build-action":
      return <GenericResultCard toolName={toolName} data={result} />;

    // Deployment
    case "kwala-verify-workflow":
      return <VerifyCard data={result} />;
    case "kwala-deploy-workflow":
      return <DeploymentProgressCard data={result as Record<string, unknown>} />;
    case "kwala-workflow-status":
      return <WorkflowStatusCard data={result} />;
    case "kwala-list-workflows":
      return <WorkflowListCard data={result} />;
    case "kwala-deactivate-workflow":
      return <GenericResultCard toolName={toolName} data={result} />;

    // Explorer
    case "kwala-explorer-stats":
      return <ExplorerStatsCard data={result} />;
    case "kwala-explorer-actions":
      return <GenericResultCard toolName={toolName} data={result} />;
    case "kwala-get-workflow":
      return <GenericResultCard toolName={toolName} data={result} />;
    case "kwala-fetch-abi":
      return <GenericResultCard toolName={toolName} data={result} />;

    // Account
    case "kwala-wallet":
      return <WalletCard data={result} />;
    case "kwala-credit-balance":
      return <CreditBalanceCard data={result} />;
    case "kwala-configure":
      return <ConfigureCard data={result} />;
    case "kwala-login":
      return <GenericResultCard toolName={toolName} data={result} />;

    // System
    case "kwala-list-chains":
      return <ChainSelectorCard data={result} />;
    case "kwala-tools":
      return <GenericResultCard toolName={toolName} data={result} />;

    default:
      return <GenericResultCard toolName={toolName} data={result} />;
  }
}

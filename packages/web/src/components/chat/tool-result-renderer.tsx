"use client";

import { useCallback } from "react";
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

/**
 * Generic handler type for addToolOutput.
 * We use `any` for tool generics since MCP tools are dynamic.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AddToolOutputHandler = (args: {
  tool: string;
  toolCallId: string;
  output: unknown;
  state?: "output-available" | "output-error";
  errorText?: string;
}) => void | Promise<void>;

interface ToolResultRendererProps {
  toolName: string;
  result: unknown;
  toolCallId?: string;
  addToolOutput?: AddToolOutputHandler;
}

export function ToolResultRenderer({
  toolName,
  result,
  toolCallId,
  addToolOutput,
}: ToolResultRendererProps) {
  if (result === null || result === undefined) {
    return <ErrorCard error="Tool result not available." toolName={toolName} />;
  }

  // Handler factories for selectable cards
  const handleChainSelect = useCallback(
    (chain: { id: number; name: string; symbol: string }) => {
      if (!addToolOutput || !toolCallId) return;
      addToolOutput({
        tool: toolName,
        toolCallId,
        output: {
          selectedChain: chain.name,
          chainId: chain.id,
          symbol: chain.symbol,
        },
      });
    },
    [addToolOutput, toolCallId, toolName]
  );

  const handleTemplateSelect = useCallback(
    (template: { id: string; name: string }) => {
      if (!addToolOutput || !toolCallId) return;
      addToolOutput({
        tool: toolName,
        toolCallId,
        output: {
          selectedTemplate: template.id,
          templateName: template.name,
        },
      });
    },
    [addToolOutput, toolCallId, toolName]
  );

  const handleDeployRequest = useCallback(
    (yaml: string, name: string) => {
      if (!addToolOutput || !toolCallId) return;
      addToolOutput({
        tool: toolName,
        toolCallId,
        output: {
          action: "deploy",
          yaml,
          workflowName: name,
        },
      });
    },
    [addToolOutput, toolCallId, toolName]
  );

  switch (toolName) {
    // Workflow Generation
    case "kwala-create-automation":
      return (
        <AutomationCard
          data={result}
          onDeploy={addToolOutput && toolCallId ? handleDeployRequest : undefined}
        />
      );
    case "kwala-explain-yaml":
      return <GenericResultCard toolName={toolName} data={result} />;
    case "kwala-list-templates":
      return (
        <TemplateGalleryCard
          data={result}
          onSelect={addToolOutput && toolCallId ? handleTemplateSelect : undefined}
        />
      );
    case "kwala-build-trigger":
      return <GenericResultCard toolName={toolName} data={result} />;
    case "kwala-build-action":
      return <GenericResultCard toolName={toolName} data={result} />;

    // Deployment
    case "kwala-verify-workflow":
      return <VerifyCard data={result} />;
    case "kwala-deploy-workflow":
      return (
        <DeploymentProgressCard data={result as Record<string, unknown>} />
      );
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
      return (
        <ChainSelectorCard
          data={result}
          onSelect={addToolOutput && toolCallId ? handleChainSelect : undefined}
        />
      );
    case "kwala-tools":
      return <GenericResultCard toolName={toolName} data={result} />;

    default:
      return <GenericResultCard toolName={toolName} data={result} />;
  }
}

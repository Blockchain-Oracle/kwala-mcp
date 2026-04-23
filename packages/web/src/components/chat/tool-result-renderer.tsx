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
  CreditBalanceCard,
  VerifyCard,
  WorkflowListCard,
  ConfigureCard,
  GenericResultCard,
  ErrorCard,
} from "@/components/kwala";

/**
 * Generic handler type for addToolOutput.
 * Matches the ChatAddToolOutputFunction signature from the AI SDK.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AddToolOutputHandler = (...args: any[]) => any;

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
    case "createAutomation":
      return (
        <AutomationCard
          data={result}
          onDeploy={addToolOutput && toolCallId ? handleDeployRequest : undefined}
        />
      );
    case "explainYaml":
      return <GenericResultCard toolName={toolName} data={result} />;
    case "listTemplates":
      return (
        <TemplateGalleryCard
          data={result}
          onSelect={addToolOutput && toolCallId ? handleTemplateSelect : undefined}
        />
      );

    // Deployment
    case "verifyWorkflow":
      return <VerifyCard data={result} />;
    case "prepareDeploy":
      return (
        <DeploymentProgressCard data={result as Record<string, unknown>} />
      );
    case "workflowStatus":
      return <WorkflowStatusCard data={result} />;
    case "listWorkflows":
      return <WorkflowListCard data={result} />;
    case "deactivateWorkflow":
      return <GenericResultCard toolName={toolName} data={result} />;

    // Explorer
    case "explorerStats":
      return <ExplorerStatsCard data={result} />;
    case "explorerActions":
      return <GenericResultCard toolName={toolName} data={result} />;
    case "getWorkflow":
      return <GenericResultCard toolName={toolName} data={result} />;
    case "fetchAbi":
      return <GenericResultCard toolName={toolName} data={result} />;

    // Account
    case "getWalletInfo":
      return <WalletCard data={result} />;
    case "checkBalance":
      return <CreditBalanceCard data={result} />;
    case "configureNotifications":
      return <ConfigureCard data={result} />;
    case "listChains":
      return (
        <ChainSelectorCard
          data={result}
          onSelect={addToolOutput && toolCallId ? handleChainSelect : undefined}
        />
      );

    default:
      return <GenericResultCard toolName={toolName} data={result} />;
  }
}

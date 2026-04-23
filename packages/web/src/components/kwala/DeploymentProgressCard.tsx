"use client";

import {
  Rocket,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  FileCode,
} from "lucide-react";
import { BaseCard, DataRow } from "./base";
import { ErrorCard } from "./base";
import { TransactionWrapper } from "@/components/transactions";
import type { TransactionStep } from "@/lib/types/transactions";
import { KWALA_TX_DEFAULTS } from "@/lib/types/transactions";

interface DeployStep {
  step: string;
  status: string;
  tx_hash?: string;
  chaincode_address?: string;
  error?: string;
}

interface DeployResult {
  workflow_name?: string;
  yaml?: string;
  steps?: DeployStep[];
  /** deploy-workflow returns "status", prepare-deploy may use "final_status" */
  status?: string;
  final_status?: string;
  deployed?: boolean;
  workflow_id?: string;
  chaincode_address?: string;
  explorer?: { workflow?: string; dashboard?: string };
  error?: string;
  suggestion?: string;
  note?: string;
  /** Transaction steps for client-side signing (prepare-deploy) */
  transactions?: Array<{
    name: string;
    to: string;
    data: string;
    chainId?: number;
    gasPrice?: string;
    gasLimit?: string;
  }>;
  /** prepare-deploy fields */
  prepared?: boolean;
  instructions?: string[];
}

interface DeploymentProgressCardProps {
  data: { content?: Array<{ text?: string }>; [key: string]: unknown };
}

function parseResult(data: unknown): DeployResult {
  if (!data) return {};
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    if (d.content && Array.isArray(d.content)) {
      const text = d.content.find(
        (c: Record<string, unknown>) => c.type === "text"
      ) as Record<string, unknown> | undefined;
      if (text?.text) {
        try {
          return JSON.parse(text.text as string);
        } catch {
          return { error: text.text as string };
        }
      }
    }
    return d as DeployResult;
  }
  return {};
}

function StepIndicator({ step, status }: { step: string; status: string }) {
  const isComplete = status === "success" || status === "completed";
  const isFailed = status === "failed" || status === "error";
  const isPending = !isComplete && !isFailed;

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="shrink-0">
        {isComplete && (
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-green-400" />
          </div>
        )}
        {isFailed && (
          <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          </div>
        )}
        {isPending && (
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground capitalize">
          {step.replace(/_/g, " ")}
        </p>
        <p className="text-xs text-muted-foreground capitalize">{status}</p>
      </div>
    </div>
  );
}

export function DeploymentProgressCard({ data }: DeploymentProgressCardProps) {
  const result = parseResult(data);

  if (result.error && !result.steps) {
    return <ErrorCard error={result.error} toolName="Deploy Workflow" />;
  }

  const effectiveStatus = result.status ?? result.final_status;
  const isSuccess =
    result.deployed === true || effectiveStatus === "active" || effectiveStatus === "deployed";

  // Phase 1: Client-side signing mode
  // If we have transactions from kwala-prepare-deploy, show wallet signing UI
  if (result.transactions && (result.transactions as unknown[]).length > 0) {
    const rawSteps = result.transactions as Array<Record<string, unknown>>;
    const txSteps: TransactionStep[] = rawSteps.map((s) => ({
      name: String(s.name ?? ""),
      to: String(s.to ?? ""),
      data: String(s.data ?? ""),
      chainId: Number(s.chainId ?? KWALA_TX_DEFAULTS.chainId),
      gasPrice: String(s.gasPrice ?? KWALA_TX_DEFAULTS.gasPrice),
      gasLimit: String(s.gasLimit ?? KWALA_TX_DEFAULTS.gasLimit),
    }));

    return (
      <BaseCard
        title="Deploy Workflow"
        icon={<Rocket className="w-4 h-4" />}
      >
        <TransactionWrapper
          workflowName={result.workflow_name ?? "Workflow"}
          steps={txSteps}
          buttonText="Sign & Deploy"
        >
          {result.workflow_name && (
            <DataRow label="Workflow" value={result.workflow_name} highlight />
          )}
          {result.yaml && (
            <div className="mt-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <FileCode className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  YAML Preview
                </span>
              </div>
              <pre className="bg-background rounded-lg border border-border p-3 overflow-x-auto text-xs font-mono text-foreground leading-relaxed max-h-32 overflow-y-auto">
                {result.yaml}
              </pre>
            </div>
          )}
          <DataRow
            label="Steps"
            value={`${txSteps.length} transaction${txSteps.length > 1 ? "s" : ""}`}
          />
          <DataRow label="Chain" value="KWALA (1905)" />
        </TransactionWrapper>
      </BaseCard>
    );
  }

  // Phase 2: Server-side deployment result (receipt)
  return (
    <BaseCard
      title={isSuccess ? "Workflow Deployed" : "Deploying Workflow"}
      icon={<Rocket className="w-4 h-4" />}
      variant={isSuccess ? "success" : "default"}
    >
      {result.workflow_name ? (
        <DataRow label="Workflow" value={result.workflow_name} highlight />
      ) : null}

      {result.steps && result.steps.length > 0 ? (
        <div className="border border-border/50 rounded-lg p-3 space-y-1">
          {result.steps.map((step, i) => (
            <div key={i}>
              <StepIndicator step={step.step} status={step.status} />
              {step.tx_hash ? (
                <DataRow
                  label="TX Hash"
                  value={step.tx_hash}
                  mono
                  copyable
                />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {result.workflow_id ? (
        <DataRow label="Workflow ID" value={result.workflow_id} mono copyable />
      ) : null}
      {result.chaincode_address ? (
        <DataRow
          label="Chaincode"
          value={result.chaincode_address}
          mono
          copyable
        />
      ) : null}
      {effectiveStatus ? (
        <DataRow label="Status" value={effectiveStatus} highlight />
      ) : null}
      {result.explorer?.workflow ? (
        <a
          href={result.explorer.workflow}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-2"
        >
          <ExternalLink className="w-3 h-3" />
          View on Explorer
        </a>
      ) : null}
      {result.note ? (
        <p className="text-xs text-muted-foreground mt-2 italic">
          {result.note}
        </p>
      ) : null}
    </BaseCard>
  );
}

"use client";

import { Rocket, Check, Loader2, AlertCircle } from "lucide-react";
import { BaseCard, DataRow } from "./base";
import { ErrorCard } from "./base";

interface DeployStep {
  step: string;
  status: string;
  tx_hash?: string;
  chaincode_address?: string;
  error?: string;
}

interface DeployResult {
  workflow_name?: string;
  steps?: DeployStep[];
  final_status?: string;
  workflow_id?: string;
  chaincode_address?: string;
  error?: string;
  suggestion?: string;
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

function StepIndicator({
  step,
  status,
}: {
  step: string;
  status: string;
}) {
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
    return (
      <ErrorCard
        error={result.error}
        toolName="Deploy Workflow"
      />
    );
  }

  const isSuccess = result.final_status === "active" || result.final_status === "deployed";

  return (
    <BaseCard
      title={isSuccess ? "Workflow Deployed" : "Deploying Workflow"}
      icon={<Rocket className="w-4 h-4" />}
      variant={isSuccess ? "success" : "default"}
    >
      {result.workflow_name && (
        <DataRow label="Workflow" value={result.workflow_name} highlight />
      )}

      {result.steps && result.steps.length > 0 && (
        <div className="border border-border/50 rounded-lg p-3 space-y-1">
          {result.steps.map((step, i) => (
            <div key={i}>
              <StepIndicator step={step.step} status={step.status} />
              {step.tx_hash && (
                <DataRow label="TX Hash" value={step.tx_hash} mono copyable />
              )}
            </div>
          ))}
        </div>
      )}

      {result.workflow_id && (
        <DataRow label="Workflow ID" value={result.workflow_id} mono copyable />
      )}
      {result.chaincode_address && (
        <DataRow
          label="Chaincode"
          value={result.chaincode_address}
          mono
          copyable
        />
      )}
      {result.final_status && (
        <DataRow label="Status" value={result.final_status} highlight />
      )}
    </BaseCard>
  );
}

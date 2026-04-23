"use client";

import { ReactNode, useState } from "react";
import {
  Zap,
  Loader2,
  XCircle,
  AlertCircle,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { useAccount } from "wagmi";
import { useKwalaTransaction } from "@/hooks/use-kwala-transaction";
import type { TransactionStep, TransactionState } from "@/lib/types/transactions";
import { cn } from "@/lib/utils";

interface TransactionWrapperProps {
  children?: ReactNode;
  workflowName: string;
  steps: TransactionStep[];
  buttonText?: string;
  onSuccess?: (txHashes: string[]) => void;
  onError?: (error: string) => void;
}

/** Button styling by state */
function getButtonStyles(
  state: TransactionState,
  isConnected: boolean
): string {
  if (!isConnected) return "bg-zinc-600 cursor-not-allowed";
  switch (state) {
    case "success":
      return "bg-green-600 hover:bg-green-700";
    case "error":
      return "bg-red-600 hover:bg-red-700";
    default:
      return "bg-primary hover:bg-primary/90";
  }
}

function getButtonLabel(state: TransactionState): ReactNode {
  switch (state) {
    case "idle":
      return (
        <>
          <Zap className="w-4 h-4" />
          Sign &amp; Deploy
        </>
      );
    case "signing":
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Waiting for signature...
        </>
      );
    case "broadcasting":
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Broadcasting...
        </>
      );
    case "confirming":
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Confirming...
        </>
      );
    case "error":
      return (
        <>
          <XCircle className="w-4 h-4" />
          Try Again
        </>
      );
    case "success":
      return (
        <>
          <CheckCircle className="w-4 h-4" />
          Complete
        </>
      );
    default:
      return "Submit";
  }
}

/**
 * Wraps transaction details with signing UI.
 * Handles multi-step KWALA chain transactions with
 * step-by-step progress tracking.
 */
export function TransactionWrapper({
  children,
  workflowName,
  steps,
  buttonText,
  onSuccess,
  onError,
}: TransactionWrapperProps) {
  const { isConnected } = useAccount();
  const { progress, status, txHashes, error, execute, reset } =
    useKwalaTransaction();

  const handleSign = async () => {
    if (!isConnected) return;

    try {
      const hashes = await execute(workflowName, steps);
      onSuccess?.(hashes);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Transaction failed";
      onError?.(errorMsg);
    }
  };

  const handleReset = () => {
    reset();
  };

  // Success receipt
  if (status === "success" && txHashes.length > 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-400">
              Deployment Complete
            </p>
            <p className="text-xs text-muted-foreground">
              {txHashes.length} transaction{txHashes.length > 1 ? "s" : ""}{" "}
              confirmed
            </p>
          </div>
        </div>

        {/* Show tx hashes */}
        {txHashes.map((rawHash, i) => {
          const hash = typeof rawHash === "string" ? rawHash : String((rawHash as Record<string, unknown>)?.txHash ?? rawHash);
          return (
          <div
            key={hash}
            className="flex items-center justify-between p-2 bg-muted/30 rounded-lg border border-border/50 overflow-hidden"
          >
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
              <span className="text-xs text-muted-foreground shrink-0">
                Step {i + 1}:
              </span>
              <span className="text-xs font-mono text-foreground truncate break-all">
                {hash.slice(0, 10)}...{hash.slice(-8)}
              </span>
            </div>
            <a
              href={`https://kwala-explorer.lovable.app/workflow/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          );
        })}

        <button
          onClick={handleReset}
          className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Dismiss
        </button>
      </div>
    );
  }

  // Step progress
  if (progress && status !== "idle" && status !== "error") {
    return (
      <div className="space-y-3 overflow-hidden">
        {children}

        {/* Step progress */}
        <div className="border border-border/50 rounded-lg p-3 space-y-2">
          {progress.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="shrink-0">
                {step.status === "success" && (
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                  </div>
                )}
                {step.status === "error" && (
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                    <XCircle className="w-3 h-3 text-red-400" />
                  </div>
                )}
                {(step.status === "signing" ||
                  step.status === "broadcasting") && (
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Loader2 className="w-3 h-3 text-primary animate-spin" />
                  </div>
                )}
                {step.status === "pending" && (
                  <div className="w-5 h-5 rounded-full bg-muted/50 border border-border" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground capitalize">
                  {step.name.replace(/_/g, " ")}
                </p>
                {step.txHash && (
                  <p className="text-[10px] text-muted-foreground font-mono truncate">
                    {step.txHash}
                  </p>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] uppercase font-bold tracking-wider",
                  step.status === "success" && "text-green-400",
                  step.status === "error" && "text-red-400",
                  step.status === "pending" && "text-muted-foreground",
                  (step.status === "signing" ||
                    step.status === "broadcasting") &&
                    "text-primary"
                )}
              >
                {step.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {children}

      {/* Wallet connection warning */}
      {!isConnected && (
        <div className="flex items-center gap-2 p-2.5 bg-amber-900/20 border border-amber-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300">
            Connect your wallet to sign this transaction
          </p>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-2 p-2.5 bg-red-900/20 border border-red-500/30 rounded-lg">
          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-red-400">
              Transaction Failed
            </p>
            <p className="text-xs text-red-300 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Sign button */}
      <button
        onClick={status === "error" ? handleReset : handleSign}
        disabled={!isConnected || (status !== "idle" && status !== "error")}
        className={cn(
          "w-full flex items-center justify-center gap-2",
          "py-2.5 px-4 rounded-lg font-medium text-sm",
          "transition-all duration-200 text-white",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          getButtonStyles(status, isConnected)
        )}
      >
        {buttonText && status === "idle" ? (
          <>
            <Zap className="w-4 h-4" />
            {buttonText}
          </>
        ) : (
          getButtonLabel(status)
        )}
      </button>
    </div>
  );
}

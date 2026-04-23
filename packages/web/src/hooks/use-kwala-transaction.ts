"use client";

import { useState, useCallback } from "react";
import { useAccount, useSendTransaction } from "wagmi";
import type {
  TransactionState,
  TransactionStep,
  DeployStepStatus,
  DeploymentProgress,
} from "@/lib/types/transactions";
import { KWALA_TX_DEFAULTS } from "@/lib/types/transactions";

interface UseKwalaTransactionReturn {
  progress: DeploymentProgress | null;
  status: TransactionState;
  currentStep: number;
  txHashes: string[];
  error: string | null;
  execute: (
    workflowName: string,
    steps: TransactionStep[]
  ) => Promise<string[]>;
  reset: () => void;
}

export function useKwalaTransaction(): UseKwalaTransactionReturn {
  const [progress, setProgress] = useState<DeploymentProgress | null>(null);
  const [status, setStatus] = useState<TransactionState>("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [txHashes, setTxHashes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { address } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();

  const reset = useCallback(() => {
    setProgress(null);
    setStatus("idle");
    setCurrentStep(0);
    setTxHashes([]);
    setError(null);
  }, []);

  const execute = useCallback(
    async (workflowName: string, steps: TransactionStep[]) => {
      if (!address) throw new Error("Wallet not connected");

      reset();

      const initialSteps: DeployStepStatus[] = steps.map((s) => ({
        name: s.name,
        status: "pending" as const,
      }));

      const prog: DeploymentProgress = {
        workflowName,
        currentStep: 0,
        totalSteps: steps.length,
        steps: initialSteps,
        status: "signing",
      };

      setProgress(prog);
      setStatus("signing");

      const hashes: string[] = [];

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        setCurrentStep(i);

        prog.currentStep = i;
        prog.steps[i] = { ...prog.steps[i], status: "signing" };
        prog.status = "signing";
        setProgress({ ...prog });
        setStatus("signing");

        try {
          console.log(`[kwala-tx] Step ${i + 1}/${steps.length}: ${step.name}`);

          prog.steps[i] = { ...prog.steps[i], status: "broadcasting" };
          prog.status = "broadcasting";
          setProgress({ ...prog });
          setStatus("broadcasting");

          const result = await sendTransactionAsync({
            to: step.to as `0x${string}`,
            data: step.data as `0x${string}`,
            chainId: step.chainId ?? KWALA_TX_DEFAULTS.chainId,
            gasPrice: BigInt(step.gasPrice ?? KWALA_TX_DEFAULTS.gasPrice),
            gas: BigInt(step.gasLimit ?? KWALA_TX_DEFAULTS.gasLimit),
            type: "legacy",
            value: BigInt(0),
          });

          console.log("[kwala-tx] Raw result:", result);

          const hash = typeof result === "object" && result !== null
            ? ((result as Record<string, unknown>).txHash as string) ?? String(result)
            : String(result);

          console.log("[kwala-tx] Hash:", hash);

          hashes.push(hash);
          setTxHashes([...hashes]);

          prog.steps[i] = {
            ...prog.steps[i],
            status: "success",
            txHash: hash,
          };
          setProgress({ ...prog });

          // KWALA gateway needs time between transactions
          if (i < steps.length - 1) {
            prog.status = "confirming";
            setProgress({ ...prog });
            setStatus("confirming");
            console.log("[kwala-tx] Waiting 8s before next step...");
            await new Promise((resolve) => setTimeout(resolve, 8000));
          }
        } catch (err) {
          console.error("[kwala-tx] Failed:", err);
          const errorMsg =
            err instanceof Error ? err.message : "Transaction failed";

          prog.steps[i] = {
            ...prog.steps[i],
            status: "error",
            error: errorMsg,
          };
          prog.status = "error";
          prog.error = errorMsg;
          setProgress({ ...prog });
          setStatus("error");
          setError(errorMsg);
          throw err;
        }
      }

      prog.status = "success";
      setProgress({ ...prog });
      setStatus("success");
      return hashes;
    },
    [sendTransactionAsync, address, reset]
  );

  return {
    progress,
    status,
    currentStep,
    txHashes,
    error,
    execute,
    reset,
  };
}

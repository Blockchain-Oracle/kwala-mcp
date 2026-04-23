"use client";

import { useState, useCallback } from "react";
import { useAccount, useWalletClient } from "wagmi";
import type {
  TransactionState,
  TransactionStep,
  DeployStepStatus,
  DeploymentProgress,
} from "@/lib/types/transactions";
import { KWALA_TX_DEFAULTS } from "@/lib/types/transactions";

const KWALA_RPC_URL = "https://rpc-ohio.kwala.network";

/**
 * Send a raw signed transaction directly to KWALA RPC.
 * KWALA gateway only accepts eth_sendRawTransaction, not eth_sendTransaction.
 */
async function sendRawToKwala(signedTx: string): Promise<string> {
  const res = await fetch(KWALA_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_sendRawTransaction",
      params: [signedTx],
      id: 1,
    }),
  });
  const json = await res.json() as { result?: unknown; error?: { message: string } };

  if (json.error) {
    throw new Error(`KWALA RPC: ${json.error.message}`);
  }

  // KWALA returns {txHash, from, to, validation} object
  const result = json.result;
  if (typeof result === "object" && result !== null) {
    return ((result as Record<string, unknown>).txHash as string) ?? JSON.stringify(result);
  }
  return String(result);
}

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
  const { data: walletClient } = useWalletClient();

  const reset = useCallback(() => {
    setProgress(null);
    setStatus("idle");
    setCurrentStep(0);
    setTxHashes([]);
    setError(null);
  }, []);

  const execute = useCallback(
    async (workflowName: string, steps: TransactionStep[]) => {
      if (!walletClient || !address) {
        throw new Error("Wallet not connected");
      }

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

          // Sign the transaction with MetaMask
          const signedTx = await walletClient.signTransaction({
            account: address,
            to: step.to as `0x${string}`,
            data: step.data as `0x${string}`,
            chainId: step.chainId ?? KWALA_TX_DEFAULTS.chainId,
            gasPrice: BigInt(step.gasPrice ?? KWALA_TX_DEFAULTS.gasPrice),
            gas: BigInt(step.gasLimit ?? KWALA_TX_DEFAULTS.gasLimit),
            type: "legacy",
            value: BigInt(0),
            nonce: 0,
          });

          console.log("[kwala-tx] Signed, broadcasting via eth_sendRawTransaction...");

          prog.steps[i] = { ...prog.steps[i], status: "broadcasting" };
          prog.status = "broadcasting";
          setProgress({ ...prog });
          setStatus("broadcasting");

          // Send raw signed tx directly to KWALA RPC
          const hash = await sendRawToKwala(signedTx);

          console.log("[kwala-tx] TX hash:", hash);

          hashes.push(hash);
          setTxHashes([...hashes]);

          prog.steps[i] = {
            ...prog.steps[i],
            status: "success",
            txHash: hash,
          };
          setProgress({ ...prog });

          // Wait between steps
          if (i < steps.length - 1) {
            prog.status = "confirming";
            setProgress({ ...prog });
            setStatus("confirming");
            console.log("[kwala-tx] Waiting 3s before next step...");
            await new Promise((resolve) => setTimeout(resolve, 3000));
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
    [walletClient, address, reset]
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

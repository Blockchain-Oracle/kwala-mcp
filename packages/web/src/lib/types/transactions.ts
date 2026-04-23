/** Transaction step for a single on-chain operation */
export interface TransactionStep {
  name: string;
  to: string;
  data: string;
  chainId: number;
  gasPrice: string;
  gasLimit: string;
}

/** Multi-step workflow deployment transaction */
export interface WorkflowDeployTransaction {
  type: "workflow_deploy";
  yaml: string;
  workflowName: string;
  steps: TransactionStep[];
}

/** Transaction state machine */
export type TransactionState =
  | "idle"
  | "signing"
  | "broadcasting"
  | "confirming"
  | "success"
  | "error";

/** Result of a completed transaction */
export interface TransactionResult {
  txHash: string;
  explorerUrl?: string;
  blockNumber?: number;
}

/** Deployment step status */
export interface DeployStepStatus {
  name: string;
  status: "pending" | "signing" | "broadcasting" | "success" | "error";
  txHash?: string;
  error?: string;
}

/** Full deployment progress state */
export interface DeploymentProgress {
  workflowName: string;
  currentStep: number;
  totalSteps: number;
  steps: DeployStepStatus[];
  status: TransactionState;
  error?: string;
}

/** KWALA chain transaction defaults */
export const KWALA_TX_DEFAULTS = {
  chainId: 1905,
  gasPrice: "1000000000", // 1 gwei
  gasLimit: "500000",
  type: 0 as const,
} as const;

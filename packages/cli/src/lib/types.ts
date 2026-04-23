import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// ─── Wallet Config ──────────────────────────────────────
export interface NotificationConfig {
  telegram?: { bot_token: string; chat_id: string };
  discord?: { webhook_url: string };
  webhook?: { url: string };
}

export interface KwalaConfig {
  privateKey: string;
  address: string;
  createdAt: string;
  default_chain?: string;
  notifications?: NotificationConfig;
  auth?: { jwt: string; email?: string; expires?: number };
}

// ─── Chain Info ──────────────────────────────────────────
export interface ChainInfo {
  id: number;
  name: string;
  network: "mainnet" | "testnet" | "internal";
  symbol: string;
  testnetOf?: number;
}

// ─── API Response Types ─────────────────────────────────
export interface VerifyResponse {
  syntax_check: boolean;
  schema_validation: boolean;
  error?: string;
}

export interface ChaincodeResponse {
  chaincode_address: string;
}

export interface WorkflowStatusResponse {
  [key: string]: unknown;
}

export interface ActionLogEntry {
  id: number;
  workflow_id: string;
  action_id: string;
  execution_time: number;
  chain_id: number;
  success: boolean;
  workflow_starttime: number;
  retries: number;
  next_run: number;
  gas_fees: string;
  error: string;
  trace_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ExplorerStats {
  total_actions: number;
  total_workflows: number;
  filtered_by?: string | null;
}

// ─── Deploy Result ──────────────────────────────────────
export interface DeployStep {
  name: string;
  status: "ok" | "failed" | "skipped";
  tx_hash?: string;
  error?: string;
}

export interface DeployResult {
  deployed: boolean;
  workflow_id: string;
  chaincode_address?: string;
  steps: DeployStep[];
  error?: string;
}

// ─── Workflow Template ──────────────────────────────────
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: "alerts" | "defi" | "nft" | "monitoring" | "notifications";
  trigger_type: string;
  actions: string[];
  chains: string[];
  yaml: string;
}

// ─── Token Info ─────────────────────────────────────────
export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  addresses: Record<number, string>;
}

// ─── Re-export MCP type for convenience ─────────────────
export type { CallToolResult };

import { tool } from "ai";
import { z } from "zod";
import YAML from "yaml";
import { Interface } from "ethers";
import { kwalaPost, kwalaGet } from "../kwala-api";
import {
  validateWorkflow,
  KWALA_CHAIN_ID,
  KWALA_CONTRACT_ADDRESS,
  KWALA_GAS_PRICE,
  KWALA_GAS_LIMIT,
  CONTRACT_ABI,
} from "../constants";

const iface = new Interface(CONTRACT_ABI);

function mutateYamlName(yamlStr: string, address: string): string {
  const parsed = YAML.parse(yamlStr) as Record<string, unknown>;
  const originalName = parsed.Name as string;
  parsed.Name = `${originalName}_${address}`;
  return YAML.stringify(parsed);
}

function extractWorkflowName(yamlStr: string): string {
  const parsed = YAML.parse(yamlStr) as Record<string, unknown>;
  return parsed.Name as string;
}

// ── prepareDeploy ───────────────────────────────────────────────────────

export const prepareDeploy = tool({
  description:
    "Prepare unsigned transactions for deploying a workflow via browser wallet. Returns encoded calldata for save and deploy steps that the user signs with MetaMask.",
  inputSchema: z.object({
    yaml: z.string().describe("The Kwalang YAML workflow to deploy."),
    user_address: z
      .string()
      .describe("The connected wallet address that will sign the transactions."),
  }),
  execute: async ({ yaml: yamlStr, user_address }) => {
    // Local validation
    const local = validateWorkflow(yamlStr);
    if (!local.valid) {
      return { error: `Validation failed: ${local.errors?.join("; ")}` };
    }

    // API verification
    try {
      const verifyResult = await kwalaPost<{
        syntax_check: boolean;
        schema_validation: boolean;
        error?: string;
      }>("/workflow/verify", {
        yaml: yamlStr,
        user_address,
      });

      if (!verifyResult.syntax_check || !verifyResult.schema_validation) {
        return { error: `Kwala verification failed: ${verifyResult.error ?? "Fix the YAML and try again."}` };
      }
    } catch (e) {
      return { error: `Verification failed: ${e instanceof Error ? e.message : String(e)}` };
    }

    // Prepare unsigned transactions
    try {
      const workflowName = extractWorkflowName(yamlStr);
      const workflowId = `${workflowName}_${user_address}`;
      const mutatedYaml = mutateYamlName(yamlStr, user_address);

      const saveData = iface.encodeFunctionData("saveWorkflow", [mutatedYaml]);
      const deployData = iface.encodeFunctionData("deployWorkflow", [mutatedYaml]);

      return {
        prepared: true,
        workflow_id: workflowId,
        workflow_name: workflowName,
        mutated_yaml: mutatedYaml,
        rpc_url: "https://rpc-ohio.kwala.network",
        contract_address: KWALA_CONTRACT_ADDRESS,
        transactions: [
          {
            name: "save",
            to: KWALA_CONTRACT_ADDRESS,
            data: saveData,
            chainId: KWALA_CHAIN_ID,
            gasPrice: KWALA_GAS_PRICE,
            gasLimit: KWALA_GAS_LIMIT,
            value: "0",
          },
          {
            name: "deploy",
            to: KWALA_CONTRACT_ADDRESS,
            data: deployData,
            chainId: KWALA_CHAIN_ID,
            gasPrice: KWALA_GAS_PRICE,
            gasLimit: KWALA_GAS_LIMIT,
            value: "0",
          },
        ],
        instructions: [
          "Sign each transaction with your wallet in order: save, then deploy.",
          "After deploy, wait for CLAIMED status, then sign the activate transaction.",
        ],
        note: "These are unsigned transactions. Your browser wallet will sign and broadcast them to KWALA chain (1905).",
      };
    } catch (e) {
      return { error: `Failed to prepare: ${e instanceof Error ? e.message : String(e)}` };
    }
  },
});

// ── workflowStatus ──────────────────────────────────────────────────────

export const workflowStatus = tool({
  description:
    "Check the deployment and execution status of a workflow by its ID.",
  inputSchema: z.object({
    workflow_id: z.string().describe("Workflow ID (e.g., 'MyWorkflow_0xABC') or just the name."),
    user_address: z.string().optional().describe("Wallet address to append if only name provided."),
  }),
  execute: async ({ workflow_id, user_address }) => {
    let fullId = workflow_id;
    if (!workflow_id.includes("_0x") && user_address) {
      fullId = `${workflow_id}_${user_address}`;
    }

    try {
      const [status, chaincode] = await Promise.allSettled([
        kwalaGet(`/workflow/${fullId}/status`),
        kwalaGet(`/workflow/chaincode/${fullId}`),
      ]);

      const result: Record<string, unknown> = { workflow_id: fullId };

      if (status.status === "fulfilled") {
        const s = status.value as Record<string, unknown>;
        if (s.status === "" || s.status === undefined) {
          return { error: `Workflow "${fullId}" not found. Use listWorkflows to see your deployed workflows.` };
        }
        result.status = s;
      }

      if (chaincode.status === "fulfilled") {
        result.chaincode = chaincode.value;
      }

      if (status.status === "rejected" && chaincode.status === "rejected") {
        return { error: `Could not fetch status for "${fullId}". Check the workflow ID.` };
      }

      return result;
    } catch (e) {
      return { error: `Failed to check status: ${e instanceof Error ? e.message : String(e)}` };
    }
  },
});

// ── listWorkflows ───────────────────────────────────────────────────────

export const listWorkflows = tool({
  description:
    "List all workflows deployed by a wallet address.",
  inputSchema: z.object({
    address: z.string().describe("Wallet address to list workflows for."),
    page: z.number().optional().describe("Page number. Default: 1."),
    page_size: z.number().optional().describe("Results per page. Default: 10."),
  }),
  execute: async ({ address, page, page_size }) => {
    const p = page ?? 1;
    const ps = page_size ?? 10;

    try {
      const data = await kwalaGet(`/workflow/deployer/${address}`, {
        page: p,
        page_size: ps,
      });
      return { address, workflows: data };
    } catch (e) {
      return { error: `Failed to list workflows: ${e instanceof Error ? e.message : String(e)}` };
    }
  },
});

// ── deactivateWorkflow ──────────────────────────────────────────────────

export const deactivateWorkflow = tool({
  description:
    "Prepare an unsigned transaction to deactivate a running workflow. Returns calldata for the user to sign with their wallet.",
  inputSchema: z.object({
    workflow_id: z.string().describe("Workflow ID or name to deactivate."),
    user_address: z.string().describe("Connected wallet address."),
  }),
  execute: async ({ workflow_id, user_address }) => {
    let fullId = workflow_id;
    if (!workflow_id.includes("_0x")) {
      fullId = `${workflow_id}_${user_address}`;
    }

    // Get chaincode address
    try {
      const res = await kwalaGet<{ chaincode_address?: string }>(`/workflow/chaincode/${fullId}`);
      if (!res.chaincode_address) {
        return { error: `No chaincode found for "${fullId}". Is the workflow deployed?` };
      }

      const chaincodeAddress = res.chaincode_address.startsWith("0x")
        ? res.chaincode_address
        : `0x${res.chaincode_address}`;

      const deactivateIface = new Interface([
        "function updateExpiresIn(address chaincodeAddress, uint256 expiresIn)",
      ]);
      const now = Math.floor(Date.now() / 1000);
      const data = deactivateIface.encodeFunctionData("updateExpiresIn", [chaincodeAddress, now]);

      return {
        workflow_id: fullId,
        chaincode_address: chaincodeAddress,
        transaction: {
          name: "deactivate",
          to: KWALA_CONTRACT_ADDRESS,
          data,
          chainId: KWALA_CHAIN_ID,
          gasPrice: KWALA_GAS_PRICE,
          gasLimit: KWALA_GAS_LIMIT,
          value: "0",
        },
        instructions: ["Sign this transaction with your wallet to deactivate the workflow."],
      };
    } catch (e) {
      return { error: `Failed to prepare deactivation: ${e instanceof Error ? e.message : String(e)}` };
    }
  },
});

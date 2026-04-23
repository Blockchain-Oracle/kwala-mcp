import { tool } from "ai";
import { z } from "zod";
import YAML from "yaml";
import { Interface } from "ethers";
import { kwalaGet, kwalaPost } from "../kwala-api";
import {
  KWALA_CHAIN_ID,
  KWALA_CONTRACT_ADDRESS,
  KWALA_GAS_PRICE,
  KWALA_GAS_LIMIT,
  validateWorkflow,
} from "../constants";

const CONTRACT_ABI = [
  "function saveWorkflow(string yaml)",
  "function deployWorkflow(string calldata yaml)",
  "function triggerWorkflow(address chaincodeAddress)",
  "function updateExpiresIn(address chaincodeAddress, uint256 expiresIn)",
];

const iface = new Interface(CONTRACT_ABI);

function extractWorkflowName(yamlStr: string): string {
  const parsed = YAML.parse(yamlStr) as Record<string, unknown>;
  return parsed.Name as string;
}

function mutateYamlName(yamlStr: string, address: string): string {
  const parsed = YAML.parse(yamlStr) as Record<string, unknown>;
  parsed.Name = `${parsed.Name}_${address}`;
  return YAML.stringify(parsed);
}

// ── prepareDeploy ───────────────────────────────────────────────────────

export const prepareDeploy = tool({
  description:
    "Prepare unsigned transactions for deploying a workflow. Returns encoded calldata for save and deploy steps that the user signs with their connected wallet.",
  inputSchema: z.object({
    yaml: z.string().describe("The Kwalang YAML workflow to deploy."),
    user_address: z
      .string()
      .describe("The connected wallet address that will sign the transactions."),
  }),
  execute: async ({ yaml: yamlStr, user_address }) => {
    const local = validateWorkflow(yamlStr);
    if (!local.valid) {
      return { error: `Validation failed: ${local.errors?.join("; ")}` };
    }

    try {
      const verifyResult = await kwalaPost<{
        syntax_check: boolean;
        schema_validation: boolean;
        error?: string;
      }>("/workflow/verify", { yaml: yamlStr, user_address });

      if (!verifyResult.syntax_check || !verifyResult.schema_validation) {
        return { error: `Verification failed: ${verifyResult.error ?? "Fix the YAML."}` };
      }
    } catch (e) {
      return { error: `Verification failed: ${e instanceof Error ? e.message : String(e)}` };
    }

    try {
      const workflowName = extractWorkflowName(yamlStr);
      const workflowId = `${workflowName}_${user_address}`;
      const mutatedYaml = mutateYamlName(yamlStr, user_address);

      // Only saveWorkflow is needed as a wallet transaction.
      // The Kwala dashboard does: save (wallet) → deploy (automatic) → activate (wallet)
      // deployWorkflow via eth_sendTransaction is rejected by KWALA gateway.
      const saveData = iface.encodeFunctionData("saveWorkflow", [mutatedYaml]);

      return {
        prepared: true,
        workflow_id: workflowId,
        workflow_name: workflowName,
        yaml: mutatedYaml,
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
        ],
        instructions: [
          "Sign the save transaction with your wallet to deploy the workflow on-chain.",
          "After saving, the workflow will be automatically deployed by the Kwala network.",
        ],
        note: "Your wallet signs the save transaction. Kwala handles deployment and activation.",
      };
    } catch (e) {
      return { error: `Failed to prepare: ${e instanceof Error ? e.message : String(e)}` };
    }
  },
});

// ── workflowStatus ──────────────────────────────────────────────────────

export const workflowStatus = tool({
  description: "Check the deployment and execution status of a workflow.",
  inputSchema: z.object({
    user_address: z.string().describe("Wallet address."),
    workflow_id: z.string().describe("Workflow ID or name."),
  }),
  execute: async ({ user_address, workflow_id }) => {
    let fullId = workflow_id;
    if (!workflow_id.includes("_0x")) {
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
          return { error: `Workflow "${fullId}" not found.` };
        }
        result.status = s;
      }

      if (chaincode.status === "fulfilled") {
        result.chaincode = chaincode.value;
      }

      if (status.status === "rejected" && chaincode.status === "rejected") {
        return { error: `Could not fetch status for "${fullId}".` };
      }

      return result;
    } catch (e) {
      return { error: `Failed: ${e instanceof Error ? e.message : String(e)}` };
    }
  },
});

// ── listWorkflows ───────────────────────────────────────────────────────

export const listWorkflows = tool({
  description: "List all workflows deployed by a wallet address.",
  inputSchema: z.object({
    address: z.string().describe("Wallet address."),
    page: z.number().optional().describe("Page number. Default: 1."),
    page_size: z.number().optional().describe("Results per page. Default: 10."),
  }),
  execute: async ({ address, page, page_size }) => {
    try {
      const data = await kwalaGet(`/workflow/deployer/${address}`, {
        page: String(page ?? 1),
        page_size: String(page_size ?? 10),
      });
      return { address, workflows: data };
    } catch (e) {
      return { error: `Failed: ${e instanceof Error ? e.message : String(e)}` };
    }
  },
});

// ── deactivateWorkflow ──────────────────────────────────────────────────

export const deactivateWorkflow = tool({
  description: "Prepare an unsigned transaction to deactivate (expire) a running workflow.",
  inputSchema: z.object({
    user_address: z.string().describe("Wallet address."),
    workflow_id: z.string().describe("Workflow ID or name to deactivate."),
  }),
  execute: async ({ user_address, workflow_id }) => {
    let fullId = workflow_id;
    if (!workflow_id.includes("_0x")) {
      fullId = `${workflow_id}_${user_address}`;
    }

    try {
      const ccRes = await kwalaGet<{ chaincode_address?: string }>(`/workflow/chaincode/${fullId}`);
      if (!ccRes.chaincode_address) {
        return { error: `No chaincode found for "${fullId}".` };
      }

      const chaincodeAddr = ccRes.chaincode_address.startsWith("0x")
        ? ccRes.chaincode_address
        : `0x${ccRes.chaincode_address}`;

      const now = Math.floor(Date.now() / 1000);
      const data = iface.encodeFunctionData("updateExpiresIn", [chaincodeAddr, now]);

      return {
        deactivate: true,
        workflow_id: fullId,
        chaincode_address: chaincodeAddr,
        transaction: {
          name: "deactivate",
          to: KWALA_CONTRACT_ADDRESS,
          data,
          chainId: KWALA_CHAIN_ID,
          gasPrice: KWALA_GAS_PRICE,
          gasLimit: KWALA_GAS_LIMIT,
          value: "0",
        },
        note: "Sign this transaction with your wallet to stop the workflow.",
      };
    } catch (e) {
      return { error: `Failed: ${e instanceof Error ? e.message : String(e)}` };
    }
  },
});

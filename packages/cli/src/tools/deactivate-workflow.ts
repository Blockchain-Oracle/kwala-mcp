import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ok, err } from "../lib/format.js";
import { getAddress, getWallet } from "../lib/wallet.js";
import { kwalaGet } from "../lib/api.js";
import { invalidateCacheAll } from "../lib/cache.js";
import { logger } from "../lib/logger.js";
import { Interface, Transaction } from "ethers";
import type { ChaincodeResponse } from "../lib/types.js";

const RPC_URL = "https://rpc-ohio.kwala.network";
const CONTRACT = "0x3e0c606d0ce3f0dec6c569a586a59128a1d9613e";
const iface = new Interface(["function updateExpiresIn(address chaincodeAddress, uint256 expiresIn)"]);

async function expireWorkflow(chaincodeAddress: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const wallet = getWallet();
  const now = Math.floor(Date.now() / 1000);
  const data = iface.encodeFunctionData("updateExpiresIn", [chaincodeAddress, now]);

  const tx = Transaction.from({
    to: CONTRACT,
    data,
    nonce: 0,
    gasPrice: 1_000_000_000n,
    gasLimit: 500_000n,
    chainId: 1905,
    type: 0,
    value: 0,
  });

  const signed = await wallet.signTransaction(tx);
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_sendRawTransaction", params: [signed], id: 1 }),
  });
  const json = (await res.json()) as { result?: { txHash?: string }; error?: { message: string } };

  if (json.error) {
    return { success: false, error: json.error.message };
  }
  return { success: true, txHash: json.result?.txHash };
}

export function registerDeactivateWorkflowTool(server: McpServer): void {
  server.registerTool(
    "kwala-deactivate-workflow",
    {
      title: "Deactivate Workflow",
      description:
        "Stop one or all running workflows. Pass a workflow_id to stop one, or set deactivate_all=true to stop everything. Lists active workflows first so user can choose. Cannot be undone — deploy a new workflow instead.",
      inputSchema: z.object({
        workflow_id: z
          .string()
          .optional()
          .describe("Workflow ID or name to stop. Omit if using deactivate_all."),
        deactivate_all: z
          .boolean()
          .optional()
          .describe("Set to true to stop ALL your deployed workflows at once."),
        list_active: z
          .boolean()
          .optional()
          .describe("Set to true to list active workflows before deactivating. Useful to let the user choose."),
      }),
    },
    async (params) => {
      logger.debug("kwala-deactivate-workflow invoked");
      const address = getAddress();

      // List active workflows so user can choose
      if (params.list_active && !params.workflow_id && !params.deactivate_all) {
        try {
          const data = await kwalaGet<{ total_workflows: number; workflows: Array<{ workflow_id: string }> | null }>(
            `/workflow/deployer/${address}`,
            { page: 1, page_size: 50 },
          );
          const workflows = data.workflows ?? [];
          if (workflows.length === 0) {
            return ok({ active_workflows: [], message: "No deployed workflows found." });
          }

          // Check status of each
          const statuses: Array<{ workflow_id: string; status: string }> = [];
          for (const wf of workflows) {
            try {
              const s = await kwalaGet<{ status: string }>(`/workflow/${wf.workflow_id}/status`);
              statuses.push({ workflow_id: wf.workflow_id, status: s.status });
            } catch {
              statuses.push({ workflow_id: wf.workflow_id, status: "unknown" });
            }
          }

          return ok({
            active_workflows: statuses,
            message: "Use workflow_id to stop a specific one, or deactivate_all=true to stop all.",
          });
        } catch (e) {
          return err(`Failed to list workflows: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      // Deactivate ALL workflows
      if (params.deactivate_all) {
        try {
          const data = await kwalaGet<{ total_workflows: number; workflows: Array<{ workflow_id: string }> | null }>(
            `/workflow/deployer/${address}`,
            { page: 1, page_size: 50 },
          );
          const workflows = data.workflows ?? [];
          if (workflows.length === 0) {
            return ok({ message: "No deployed workflows to deactivate." });
          }

          const results: Array<{ workflow_id: string; stopped: boolean; error?: string }> = [];
          for (const wf of workflows) {
            try {
              const cc = await kwalaGet<ChaincodeResponse>(`/workflow/chaincode/${wf.workflow_id}`);
              const addr = cc.chaincode_address?.startsWith("0x") ? cc.chaincode_address : `0x${cc.chaincode_address}`;
              const r = await expireWorkflow(addr);
              results.push({ workflow_id: wf.workflow_id, stopped: r.success, error: r.error });
            } catch (e) {
              results.push({ workflow_id: wf.workflow_id, stopped: false, error: e instanceof Error ? e.message : String(e) });
            }
          }

          invalidateCacheAll();
          const stopped = results.filter((r) => r.stopped).length;
          return ok({
            deactivated_all: true,
            total: workflows.length,
            stopped,
            failed: workflows.length - stopped,
            results,
            message: `Stopped ${stopped}/${workflows.length} workflows.`,
          });
        } catch (e) {
          return err(`Failed to deactivate all: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      // Deactivate single workflow
      if (!params.workflow_id) {
        return err("Provide workflow_id to stop a specific workflow, or set deactivate_all=true to stop all. Use list_active=true to see your workflows first.", {
          suggestion: "Call with list_active=true to see which workflows are running.",
        });
      }

      let fullId = params.workflow_id;
      if (!params.workflow_id.includes("_0x")) {
        fullId = `${params.workflow_id}_${address}`;
      }

      // Get chaincode address
      let chaincodeAddress: string;
      try {
        const res = await kwalaGet<ChaincodeResponse>(`/workflow/chaincode/${fullId}`);
        if (!res.chaincode_address) {
          return err(`No chaincode found for "${fullId}". Is the workflow deployed?`, {
            suggestion: "Use kwala-list-workflows or call with list_active=true to see your workflows.",
          });
        }
        chaincodeAddress = res.chaincode_address.startsWith("0x")
          ? res.chaincode_address
          : `0x${res.chaincode_address}`;
      } catch {
        return err(`Workflow "${fullId}" not found.`, {
          suggestion: "Use kwala-list-workflows or call with list_active=true to see your workflows.",
        });
      }

      const result = await expireWorkflow(chaincodeAddress);
      if (!result.success) {
        return err(`Failed to deactivate: ${result.error}`);
      }

      invalidateCacheAll();
      return ok({
        deactivated: true,
        workflow_id: fullId,
        chaincode_address: chaincodeAddress,
        tx_hash: result.txHash,
        message: `Workflow "${fullId}" has been stopped. It will no longer execute.`,
      });
    },
  );
}

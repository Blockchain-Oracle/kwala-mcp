import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ok, err } from "../lib/format.js";
import { getAddress } from "../lib/wallet.js";
import { kwalaGet } from "../lib/api.js";
import { invalidateCacheAll } from "../lib/cache.js";
import { logger } from "../lib/logger.js";
import { Interface, Wallet, Transaction } from "ethers";
import type { ChaincodeResponse } from "../lib/types.js";

const RPC_URL = "https://rpc-ohio.kwala.network";
const CONTRACT = "0x3e0c606d0ce3f0dec6c569a586a59128a1d9613e";

export function registerDeactivateWorkflowTool(server: McpServer): void {
  server.registerTool(
    "kwala-deactivate-workflow",
    {
      title: "Deactivate Workflow",
      description:
        "Stop a running workflow by setting its expiration to now. The workflow will stop executing immediately. Cannot be undone — deploy a new workflow instead.",
      inputSchema: z.object({
        workflow_id: z
          .string()
          .describe("Workflow ID or name. Accepts the original name (auto-appends wallet) or full ID."),
      }),
    },
    async ({ workflow_id }) => {
      let fullId = workflow_id;
      if (!workflow_id.includes("_0x")) {
        fullId = `${workflow_id}_${getAddress()}`;
      }

      logger.debug({ workflow_id: fullId }, "kwala-deactivate-workflow invoked");

      // Get chaincode address
      let chaincodeAddress: string;
      try {
        const res = await kwalaGet<ChaincodeResponse>(`/workflow/chaincode/${fullId}`);
        if (!res.chaincode_address) {
          return err(`No chaincode found for "${fullId}". Is the workflow deployed?`, {
            suggestion: "Use kwala-list-workflows to see your deployed workflows.",
          });
        }
        chaincodeAddress = res.chaincode_address.startsWith("0x")
          ? res.chaincode_address
          : `0x${res.chaincode_address}`;
      } catch (e) {
        return err(`Workflow "${fullId}" not found.`, {
          suggestion: "Use kwala-list-workflows to see your deployed workflows.",
        });
      }

      // Call updateExpiresIn with current timestamp to stop immediately
      try {
        const iface = new Interface(["function updateExpiresIn(address chaincodeAddress, uint256 expiresIn)"]);
        const now = Math.floor(Date.now() / 1000);
        const data = iface.encodeFunctionData("updateExpiresIn", [chaincodeAddress, now]);

        const fs = await import("node:fs");
        const os = await import("node:os");
        const configPath = `${os.homedir()}/.kwala-mcp/config.json`;
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        const wallet = new Wallet(config.privateKey);

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
          return err(`Failed to deactivate: ${json.error.message}`);
        }

        invalidateCacheAll();

        return ok({
          deactivated: true,
          workflow_id: fullId,
          chaincode_address: chaincodeAddress,
          tx_hash: json.result?.txHash,
          message: `Workflow "${fullId}" has been stopped. It will no longer execute.`,
        });
      } catch (e) {
        return err(`Failed to deactivate: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
  );
}

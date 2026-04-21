import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ok, err } from "../lib/format.js";
import { withCache } from "../lib/cache.js";
import { kwalaGet } from "../lib/api.js";
import { getAddress } from "../lib/wallet.js";
import { logger } from "../lib/logger.js";

export function registerWorkflowStatusTool(server: McpServer): void {
  server.registerTool(
    "kwala-workflow-status",
    {
      title: "Workflow Status",
      description:
        "Check the deployment and execution status of a workflow. Accepts the original workflow name (auto-appends your wallet address) or the full workflow_id.",
      inputSchema: z.object({
        workflow_id: z
          .string()
          .describe(
            "Workflow ID (e.g., 'MyWorkflow_0xABC') or just the name (e.g., 'MyWorkflow').",
          ),
      }),
    },
    async ({ workflow_id }) => {
      let fullId = workflow_id;
      if (!workflow_id.includes("_0x")) {
        fullId = `${workflow_id}_${getAddress()}`;
      }

      logger.debug({ workflow_id: fullId }, "kwala-workflow-status invoked");

      return withCache("kwala-workflow-status", { workflow_id: fullId }, async () => {
        try {
          const [status, chaincode] = await Promise.allSettled([
            kwalaGet(`/workflow/${fullId}/status`),
            kwalaGet(`/workflow/chaincode/${fullId}`),
          ]);

          const result: Record<string, unknown> = {
            workflow_id: fullId,
          };

          if (status.status === "fulfilled") {
            result.status = status.value;
          }

          if (chaincode.status === "fulfilled") {
            result.chaincode = chaincode.value;
          }

          if (status.status === "rejected" && chaincode.status === "rejected") {
            return err(
              `Could not fetch status for ${fullId}`,
              {
                suggestion: "Check the workflow ID. Use kwala-list-workflows to see your deployed workflows.",
                retry_safe: true,
              },
            );
          }

          return ok(result);
        } catch (e) {
          logger.error({ err: e }, "kwala-workflow-status error");
          return err(
            `Failed to check status: ${e instanceof Error ? e.message : String(e)}`,
            { retry_safe: true },
          );
        }
      });
    },
  );
}

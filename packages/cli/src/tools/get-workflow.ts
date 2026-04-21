import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ok, err } from "../lib/format.js";
import { withCache } from "../lib/cache.js";
import { kwalaGet } from "../lib/api.js";
import { getAddress } from "../lib/wallet.js";
import { logger } from "../lib/logger.js";

export function registerGetWorkflowTool(server: McpServer): void {
  server.registerTool(
    "kwala-get-workflow",
    {
      title: "Fetch Deployed Workflow",
      description:
        "Fetch the full YAML definition of a deployed workflow by its ID. Accepts the original workflow name (auto-appends your wallet address) or the full workflow_id.",
      inputSchema: z.object({
        workflow_id: z
          .string()
          .describe(
            "Workflow ID (e.g., 'MyWorkflow_0xABC') or just the name (e.g., 'MyWorkflow').",
          ),
      }),
    },
    async ({ workflow_id }) => {
      // If the ID doesn't contain an underscore + 0x, try appending the wallet address
      let fullId = workflow_id;
      if (!workflow_id.includes("_0x")) {
        fullId = `${workflow_id}_${getAddress()}`;
      }

      logger.debug({ workflow_id: fullId }, "kwala-get-workflow invoked");

      return withCache("kwala-get-workflow", { workflow_id: fullId }, async () => {
        try {
          const data = await kwalaGet(`/workflow/yaml/${fullId}`);
          return ok({
            workflow_id: fullId,
            yaml: data,
          });
        } catch (e) {
          logger.error({ err: e }, "kwala-get-workflow error");
          return err(
            `Failed to fetch workflow: ${e instanceof Error ? e.message : String(e)}`,
            {
              suggestion:
                "Check the workflow ID. Use kwala-list-workflows to see your deployed workflows.",
              retry_safe: true,
            },
          );
        }
      });
    },
  );
}

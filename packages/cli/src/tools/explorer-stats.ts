import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ok, err } from "../lib/format.js";
import { withCache } from "../lib/cache.js";
import { kwalaGet } from "../lib/api.js";
import { logger } from "../lib/logger.js";

export function registerExplorerStatsTool(server: McpServer): void {
  server.registerTool(
    "kwala-explorer-stats",
    {
      title: "Kwala Network Stats",
      description:
        "Get live network-wide statistics from the Kwala Explorer: total action executions, deployed workflows, and optional per-user or per-workflow filtering.",
      inputSchema: z.object({
        user_address: z
          .string()
          .optional()
          .describe("Filter stats by a specific wallet address."),
        workflow_name: z
          .string()
          .optional()
          .describe("Filter stats by a specific workflow name."),
      }),
    },
    async ({ user_address, workflow_name }) => {
      logger.debug({ user_address, workflow_name }, "kwala-explorer-stats invoked");

      return withCache(
        "kwala-explorer-stats",
        { user_address, workflow_name },
        async () => {
          try {
            const countParams: Record<string, string> = {};
            if (user_address) countParams.user_address = user_address;
            if (workflow_name) countParams.workflow_name = workflow_name;

            const [actionsCount, workflowsCount] = await Promise.all([
              kwalaGet<unknown>("/explorer/actions/count", countParams),
              kwalaGet<unknown>("/explorer/workflows/deployed/count"),
            ]);

            return ok({
              total_actions_executed: actionsCount,
              total_workflows_deployed: workflowsCount,
              filtered_by: user_address || workflow_name || null,
            });
          } catch (e) {
            logger.error({ err: e }, "kwala-explorer-stats error");
            return err(
              `Failed to fetch explorer stats: ${e instanceof Error ? e.message : String(e)}`,
              { retry_safe: true },
            );
          }
        },
      );
    },
  );
}

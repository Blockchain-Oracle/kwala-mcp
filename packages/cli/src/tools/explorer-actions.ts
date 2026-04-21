import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ok, err } from "../lib/format.js";
import { withCache } from "../lib/cache.js";
import { kwalaGet } from "../lib/api.js";
import { logger } from "../lib/logger.js";

export function registerExplorerActionsTool(server: McpServer): void {
  server.registerTool(
    "kwala-explorer-actions",
    {
      title: "Execution Logs",
      description:
        "Browse recent workflow action executions from the Kwala Explorer. Paginated, optionally filtered by user address.",
      inputSchema: z.object({
        page: z.number().optional().describe("Page number. Default: 1"),
        page_size: z
          .number()
          .optional()
          .describe("Results per page (max 50). Default: 10"),
        user_address: z
          .string()
          .optional()
          .describe("Filter by wallet address."),
      }),
    },
    async ({ page, page_size, user_address }) => {
      const p = page ?? 1;
      const ps = Math.min(page_size ?? 10, 50);
      logger.debug({ page: p, page_size: ps, user_address }, "kwala-explorer-actions invoked");

      return withCache(
        "kwala-explorer-actions",
        { page: p, page_size: ps, user_address },
        async () => {
          try {
            const params: Record<string, string | number> = {
              page: p,
              page_size: ps,
            };
            if (user_address) params.user_address = user_address;

            const data = await kwalaGet("/explorer/actions", params);
            return ok(data);
          } catch (e) {
            logger.error({ err: e }, "kwala-explorer-actions error");
            return err(
              `Failed to fetch actions: ${e instanceof Error ? e.message : String(e)}`,
              { retry_safe: true },
            );
          }
        },
      );
    },
  );
}

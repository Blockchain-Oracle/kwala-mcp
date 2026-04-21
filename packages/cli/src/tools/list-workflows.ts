import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ok, err } from "../lib/format.js";
import { withCache } from "../lib/cache.js";
import { kwalaGet } from "../lib/api.js";
import { getAddress } from "../lib/wallet.js";
import { logger } from "../lib/logger.js";

export function registerListWorkflowsTool(server: McpServer): void {
  server.registerTool(
    "kwala-list-workflows",
    {
      title: "List Workflows",
      description:
        "List all workflows deployed by a wallet address. Uses your stored wallet by default.",
      inputSchema: z.object({
        address: z
          .string()
          .optional()
          .describe("Wallet address. Uses your stored wallet if omitted."),
        page: z.number().optional().describe("Page number. Default: 1."),
        page_size: z
          .number()
          .optional()
          .describe("Results per page. Default: 10."),
      }),
    },
    async ({ address, page, page_size }) => {
      const addr = address ?? getAddress();
      const p = page ?? 1;
      const ps = page_size ?? 10;

      logger.debug({ address: addr, page: p, page_size: ps }, "kwala-list-workflows invoked");

      return withCache("kwala-list-workflows", { address: addr, page: p, page_size: ps }, async () => {
        try {
          const data = await kwalaGet(`/workflow/deployer/${addr}`, {
            page: p,
            page_size: ps,
          });
          return ok({
            address: addr,
            workflows: data,
          });
        } catch (e) {
          logger.error({ err: e }, "kwala-list-workflows error");
          return err(
            `Failed to list workflows: ${e instanceof Error ? e.message : String(e)}`,
            { retry_safe: true },
          );
        }
      });
    },
  );
}

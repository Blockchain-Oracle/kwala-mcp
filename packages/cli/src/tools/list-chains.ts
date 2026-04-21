import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ok } from "../lib/format.js";
import { CHAINS } from "../lib/chains.js";
import { TOKENS } from "../lib/tokens.js";

export function registerListChainsTool(server: McpServer): void {
  server.registerTool(
    "kwala-list-chains",
    {
      title: "Supported Chains",
      description:
        "List all blockchain networks supported by Kwala. Includes chain IDs, symbols, and well-known token addresses per chain.",
      inputSchema: z.object({
        network: z
          .enum(["mainnet", "testnet", "all"])
          .optional()
          .describe("Filter by network type. Default: all"),
      }),
    },
    async ({ network }) => {
      const filter = network ?? "all";
      const chains =
        filter === "all"
          ? CHAINS
          : CHAINS.filter((c) => c.network === filter);

      const result = chains.map((c) => ({
        ...c,
        tokens: TOKENS.filter((t) => t.addresses[c.id] !== undefined).map(
          (t) => ({
            symbol: t.symbol,
            address: t.addresses[c.id],
          }),
        ),
      }));

      return ok(result);
    },
  );
}

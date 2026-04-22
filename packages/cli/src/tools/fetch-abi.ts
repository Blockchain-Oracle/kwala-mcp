import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ok, err } from "../lib/format.js";
import { withCache } from "../lib/cache.js";
import { fetchAbi, listEvents, listFunctions } from "../lib/abi.js";
import { resolveChainId } from "../lib/chains.js";
import { logger } from "../lib/logger.js";

export function registerFetchAbiTool(server: McpServer): void {
  server.registerTool(
    "kwala-fetch-abi",
    {
      title: "Fetch Contract ABI",
      description:
        "Fetch the ABI for any smart contract on any Kwala-supported chain. Returns the ABI as JSON with a list of all events and functions. Accepts chain name (e.g., 'Base') or chain ID.",
      inputSchema: z.object({
        address: z.string().describe("Contract address (0x...)"),
        chain: z
          .string()
          .describe(
            "Chain name or ID (e.g., 'Base', 'Ethereum', '8453', '84532').",
          ),
      }),
    },
    async ({ address, chain }) => {
      const chainId = resolveChainId(chain, true) ?? resolveChainId(chain, false) ?? Number(chain);
      if (Number.isNaN(chainId)) {
        return err(`Unknown chain: ${chain}`, {
          suggestion: "Use kwala-list-chains to see all supported chains.",
        });
      }

      logger.debug({ address, chainId }, "kwala-fetch-abi invoked");

      return withCache("kwala-fetch-abi", { address, chainId }, async () => {
        try {
          const abi = await fetchAbi(address, chainId);
          if (abi.length === 0) {
            return err(
              `No ABI found for ${address} on chain ${chainId}. The contract may not be verified.`,
              {
                suggestion:
                  "If you have the ABI, you can provide it directly when building triggers or actions.",
              },
            );
          }

          return ok({
            address,
            chain_id: chainId,
            abi,
            events: listEvents(abi),
            functions: listFunctions(abi),
          });
        } catch (e) {
          logger.error({ err: e }, "kwala-fetch-abi error");
          return err(
            `Failed to fetch ABI: ${e instanceof Error ? e.message : String(e)}`,
            { retry_safe: true },
          );
        }
      });
    },
  );
}

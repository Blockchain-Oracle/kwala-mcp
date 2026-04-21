import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ok, err } from "../lib/format.js";
import { loadOrCreateWallet, getConfigPath } from "../lib/wallet.js";
import { logger } from "../lib/logger.js";

export function registerWalletTool(server: McpServer): void {
  server.registerTool(
    "kwala-wallet",
    {
      title: "Kwala Wallet",
      description:
        "Show your KWALA chain wallet address. Creates a new wallet automatically if none exists. This wallet is used to deploy workflows on-chain.",
      inputSchema: z.object({}),
    },
    async () => {
      logger.debug("kwala-wallet invoked");
      try {
        const config = loadOrCreateWallet();
        return ok({
          address: config.address,
          kwala_chain: {
            chain_id: 1905,
            rpc: "https://rpc-ohio.kwala.network",
          },
          config_path: getConfigPath(),
          note: "This wallet deploys workflows on the KWALA chain (1905). Fund it with native tokens to deploy.",
        });
      } catch (e) {
        logger.error({ err: e }, "kwala-wallet error");
        return err(`Failed to load wallet: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
  );
}

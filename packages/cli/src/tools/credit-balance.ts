import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ok, err } from "../lib/format.js";
import { withCache } from "../lib/cache.js";
import { kwalaGet } from "../lib/api.js";
import { getAddress } from "../lib/wallet.js";
import { logger } from "../lib/logger.js";

export function registerCreditBalanceTool(server: McpServer): void {
  server.registerTool(
    "kwala-credit-balance",
    {
      title: "Credit Balance",
      description:
        "Check Kwala credit balance. Credits are consumed when workflows execute. Uses your stored wallet address by default.",
      inputSchema: z.object({
        address: z
          .string()
          .optional()
          .describe("Wallet address. Uses your stored wallet if omitted."),
      }),
    },
    async ({ address }) => {
      const addr = address ?? getAddress();
      logger.debug({ address: addr }, "kwala-credit-balance invoked");

      return withCache("kwala-credit-balance", { address: addr }, async () => {
        try {
          const [creditData, nativeRes] = await Promise.allSettled([
            kwalaGet(`/user/getBalance/${addr}`),
            fetch("https://rpc-ohio.kwala.network", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getBalance", params: [addr, "latest"], id: 1 }),
            }).then(r => r.json()).then((j: { result?: string }) => {
              const wei = BigInt((j as Record<string, string>).result ?? "0x0");
              return Number(wei) / 1e18;
            }),
          ]);

          const credits = creditData.status === "fulfilled"
            ? typeof creditData.value === "object" && creditData.value !== null && "balance" in (creditData.value as Record<string, unknown>)
              ? String((creditData.value as Record<string, unknown>).balance)
              : String(creditData.value)
            : "unavailable";

          const giniBalance = nativeRes.status === "fulfilled" ? nativeRes.value : 0;

          return ok({
            address: addr,
            credits,
            gini_balance: giniBalance % 1 === 0 ? String(giniBalance) : giniBalance.toFixed(6),
            purchase_info:
              "Purchase credits at https://payments.kwala.network (~49 USDT = 20 credits on BNB Chain)",
          });
        } catch (e) {
          logger.error({ err: e }, "kwala-credit-balance error");
          return err(
            `Failed to fetch balance: ${e instanceof Error ? e.message : String(e)}`,
            { suggestion: "Ensure the wallet address is valid.", retry_safe: true },
          );
        }
      });
    },
  );
}

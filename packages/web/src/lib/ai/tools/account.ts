import { tool } from "ai";
import { z } from "zod";
import { kwalaGet } from "../kwala-api";
import { CHAINS, TOKENS } from "../constants";

// ── getWalletInfo ───────────────────────────────────────────────────────

export const getWalletInfo = tool({
  description:
    "Show the connected wallet address and KWALA chain info. Returns the wallet address passed from the frontend.",
  inputSchema: z.object({
    wallet_address: z.string().optional().describe("The connected wallet address (auto-injected)."),
  }),
  execute: async ({ wallet_address }) => {
    if (!wallet_address) {
      return {
        error: "No wallet connected. Please connect your wallet to continue.",
      };
    }

    return {
      address: wallet_address,
      kwala_chain: {
        chain_id: 1905,
        rpc: "https://rpc-ohio.kwala.network",
      },
      note: "This wallet deploys workflows on the KWALA chain (1905). Fund it with native tokens to deploy.",
    };
  },
});

// ── checkBalance ────────────────────────────────────────────────────────

export const checkBalance = tool({
  description:
    "Check Kwala credit balance. Credits are consumed when workflows execute.",
  inputSchema: z.object({
    address: z.string().describe("Wallet address to check balance for."),
  }),
  execute: async ({ address }) => {
    try {
      const data = await kwalaGet(`/user/getBalance/${address}`);
      return {
        address,
        balance: data,
        purchase_info:
          "Purchase credits at https://payments.kwala.network (~49 USDT = 20 credits on BNB Chain)",
      };
    } catch (e) {
      return { error: `Failed to fetch balance: ${e instanceof Error ? e.message : String(e)}` };
    }
  },
});

// ── configureNotifications ──────────────────────────────────────────────
// Client-side tool — no execute. The frontend renders a config UI,
// user fills in Telegram/Discord details, addToolOutput saves to localStorage.

export const configureNotifications = tool({
  description:
    "Configure Telegram or Discord notification settings. Saves to browser storage so future workflows auto-use them. Call this when the user wants to set up notifications or when notification config is missing.",
  inputSchema: z.object({
    telegram_bot_token: z.string().optional().describe("Telegram bot token from @BotFather."),
    telegram_chat_id: z.string().optional().describe("Telegram chat ID."),
    discord_webhook_url: z.string().optional().describe("Discord webhook URL."),
    action: z.enum(["view", "save"]).optional().describe("'view' to check current config, 'save' to store new config. Default: view."),
  }),
  // No execute — this is a client-side tool.
  // The frontend handles it via onToolCall in chat.tsx
});

// ── listChains ──────────────────────────────────────────────────────────

export const listChains = tool({
  description:
    "List all blockchain networks supported by Kwala with chain IDs, symbols, and well-known token addresses.",
  inputSchema: z.object({
    network: z
      .enum(["mainnet", "testnet", "all"])
      .optional()
      .describe("Filter by network type. Default: all"),
  }),
  execute: async ({ network }) => {
    const filter = network ?? "all";
    const chains =
      filter === "all"
        ? CHAINS
        : CHAINS.filter((c) => c.network === filter);

    return chains.map((c) => ({
      ...c,
      tokens: TOKENS.filter((t) => t.addresses[c.id] !== undefined).map((t) => ({
        symbol: t.symbol,
        address: t.addresses[c.id],
      })),
    }));
  },
});

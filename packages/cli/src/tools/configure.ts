import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ok, err } from "../lib/format.js";
import { getConfig, updateConfig, getConfigPath } from "../lib/wallet.js";
import { logger } from "../lib/logger.js";

export function registerConfigureTool(server: McpServer): void {
  server.registerTool(
    "kwala-configure",
    {
      title: "Configure Kwala",
      description:
        "View or update your Kwala notification settings. Store Telegram bot token, Discord webhook, and default chain so they auto-populate in all workflows. Call with no params to see current config.",
      inputSchema: z.object({
        telegram_bot_token: z
          .string()
          .optional()
          .describe("Telegram bot token from @BotFather."),
        telegram_chat_id: z
          .string()
          .optional()
          .describe("Telegram chat ID where notifications are sent."),
        discord_webhook_url: z
          .string()
          .optional()
          .describe("Discord webhook URL for notifications."),
        default_chain: z
          .string()
          .optional()
          .describe("Default chain name (e.g., 'Base', 'Ethereum', 'Polygon'). Default: Base."),
      }),
    },
    async (params) => {
      logger.debug("kwala-configure invoked");

      const hasUpdate =
        params.telegram_bot_token ||
        params.telegram_chat_id ||
        params.discord_webhook_url ||
        params.default_chain;

      if (!hasUpdate) {
        // Show current config (without private key)
        const config = getConfig();
        const configured: string[] = [];
        const missing: string[] = [];

        if (config.notifications?.telegram?.bot_token) {
          configured.push("Telegram");
        } else {
          missing.push("Telegram (provide telegram_bot_token and telegram_chat_id)");
        }

        if (config.notifications?.discord?.webhook_url) {
          configured.push("Discord");
        } else {
          missing.push("Discord (provide discord_webhook_url)");
        }

        return ok({
          wallet: config.address,
          default_chain: config.default_chain ?? "base",
          notifications: {
            configured,
            not_configured: missing,
            telegram: config.notifications?.telegram
              ? { chat_id: config.notifications.telegram.chat_id, bot_token_set: true }
              : null,
            discord: config.notifications?.discord
              ? { webhook_url_set: true }
              : null,
          },
          config_path: getConfigPath(),
          tip: missing.length > 0
            ? `Set up notifications so workflows can auto-notify without extra params. ${missing.join("; ")}`
            : "All notification channels configured. Workflows will auto-use these settings.",
        });
      }

      // Build update
      const update: Parameters<typeof updateConfig>[0] = {};

      if (params.telegram_bot_token || params.telegram_chat_id) {
        const config = getConfig();
        const existing = config.notifications?.telegram;
        const botToken = params.telegram_bot_token ?? existing?.bot_token;
        const chatId = params.telegram_chat_id ?? existing?.chat_id;

        if (botToken && chatId) {
          update.notifications = {
            ...config.notifications,
            telegram: { bot_token: botToken, chat_id: chatId },
          };
        } else if (botToken && !chatId) {
          return err(
            "telegram_chat_id is also required. Search for @userinfobot on Telegram, tap Start — it replies with your chat ID instantly.",
            { missing_params: ["telegram_chat_id"] },
          );
        } else if (chatId && !botToken) {
          return err(
            "telegram_bot_token is also required. Create a bot via @BotFather on Telegram to get your token.",
            { missing_params: ["telegram_bot_token"] },
          );
        }
      }

      if (params.discord_webhook_url) {
        const config = getConfig();
        update.notifications = {
          ...update.notifications,
          ...config.notifications,
          discord: { webhook_url: params.discord_webhook_url },
        };
      }

      if (params.default_chain) {
        update.default_chain = params.default_chain;
      }

      const merged = updateConfig(update);

      const saved: string[] = [];
      if (params.telegram_bot_token || params.telegram_chat_id) saved.push("Telegram");
      if (params.discord_webhook_url) saved.push("Discord");
      if (params.default_chain) saved.push(`Default chain: ${params.default_chain}`);

      return ok({
        updated: saved,
        wallet: merged.address,
        default_chain: merged.default_chain ?? "base",
        message: `Settings saved. Future workflows will auto-use these notification settings — no need to pass tokens/webhooks every time.`,
      });
    },
  );
}

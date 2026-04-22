import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import YAML from "yaml";
import { ok, err } from "../lib/format.js";
import { resolveChainId } from "../lib/chains.js";
import { resolveFunctionSignature, fetchAbi } from "../lib/abi.js";
import { resolveToken } from "../lib/tokens.js";
import { actionDefaults } from "../lib/defaults.js";
import { logger } from "../lib/logger.js";

export function registerBuildActionTool(server: McpServer): void {
  server.registerTool(
    "kwala-build-action",
    {
      title: "Build Action",
      description:
        "Generate a Kwalang Action YAML block. Supports contract calls, notifications (Telegram/Discord/webhook), and API calls. Auto-resolves function signatures from ABIs.",
      inputSchema: z.object({
        type: z
          .enum(["call", "notification", "api", "deploy"])
          .describe("Action type: call (contract), notification (Telegram/Discord/webhook), api (raw POST), deploy (contract deployment)."),
        name: z.string().describe("Action name (e.g., 'TransferUSDC', 'NotifyTelegram')."),

        // For "call"
        contract_address: z.string().optional().describe("Target contract address (for call type)."),
        function_name: z.string().optional().describe("Function name (e.g., 'transfer'). Auto-resolved to full signature from ABI."),
        params: z.array(z.string()).optional().describe("Function parameters. Use 're.event(N)' for dynamic values."),
        chain: z.string().optional().describe("Chain name or ID. Default: Base Sepolia."),

        // For "notification"
        channel: z.enum(["telegram", "discord", "webhook"]).optional().describe("Notification channel (for notification type)."),
        bot_token: z.string().optional().describe("Telegram bot token (for telegram channel)."),
        chat_id: z.string().optional().describe("Telegram chat ID (for telegram channel)."),
        webhook_url: z.string().optional().describe("Webhook URL (for discord or webhook channel)."),
        message: z.string().optional().describe("Message template. Use re.event(N) for dynamic data."),

        // For "api"
        api_endpoint: z.string().optional().describe("API endpoint URL (for api type)."),
        api_payload: z.string().optional().describe("JSON string payload (for api type)."),

        // For "deploy"
        bytecode: z.string().optional().describe("Contract bytecode hex (for deploy type)."),
        constructor_args: z.array(z.string()).optional().describe("Constructor arguments (for deploy type)."),

        // Common
        retries: z.number().optional().describe("Retry attempts on failure. Default: 3."),
      }),
    },
    async (params) => {
      logger.debug(params, "kwala-build-action invoked");

      try {
        const retries = params.retries ?? 3;
        let action: Record<string, unknown>;

        switch (params.type) {
          case "call": {
            if (!params.contract_address) {
              return err("contract_address is required for call actions.", { missing_params: ["contract_address"] });
            }
            const chainId = resolveChainId(params.chain ?? "base sepolia") ?? 84532;

            // Auto-resolve function signature
            let funcSig = params.function_name ?? "";
            if (funcSig && !funcSig.startsWith("function ")) {
              try {
                const abi = await fetchAbi(params.contract_address, chainId);
                const resolved = resolveFunctionSignature(abi, funcSig);
                if (resolved) funcSig = resolved;
              } catch {
                // Keep the user-provided name
              }
            }

            action = {
              ...actionDefaults(chainId),
              Name: params.name,
              Type: "call",
              TargetContract: params.contract_address,
              TargetFunction: funcSig,
              TargetParams: params.params ?? [],
              ChainID: chainId,
              RetriesUntilSuccess: retries,
            };
            break;
          }

          case "notification": {
            const channel = params.channel ?? "telegram";
            let endpoint: string;
            let payload: Record<string, unknown>;

            if (channel === "telegram") {
              if (!params.bot_token || !params.chat_id) {
                return err("bot_token and chat_id are required for Telegram notifications.", {
                  missing_params: [
                    ...(params.bot_token ? [] : ["bot_token"]),
                    ...(params.chat_id ? [] : ["chat_id"]),
                  ],
                });
              }
              endpoint = `https://api.telegram.org/bot${params.bot_token}/sendMessage`;
              payload = {
                chat_id: params.chat_id,
                text: params.message ?? "Workflow event triggered",
              };
            } else if (channel === "discord") {
              if (!params.webhook_url) {
                return err("webhook_url is required for Discord notifications.", { missing_params: ["webhook_url"] });
              }
              endpoint = params.webhook_url;
              payload = { content: params.message ?? "Workflow event triggered" };
            } else {
              if (!params.webhook_url) {
                return err("webhook_url is required for webhook notifications.", { missing_params: ["webhook_url"] });
              }
              endpoint = params.webhook_url;
              payload = { message: params.message ?? "Workflow event triggered" };
            }

            action = {
              ...actionDefaults(84532),
              Name: params.name,
              Type: "post",
              APIEndpoint: endpoint,
              APIPayload: payload,
              RetriesUntilSuccess: retries,
            };
            break;
          }

          case "api": {
            if (!params.api_endpoint) {
              return err("api_endpoint is required for api actions.", { missing_params: ["api_endpoint"] });
            }
            let payload: Record<string, unknown> = {};
            if (params.api_payload) {
              try {
                payload = JSON.parse(params.api_payload) as Record<string, unknown>;
              } catch {
                return err("api_payload must be valid JSON.");
              }
            }

            action = {
              ...actionDefaults(84532),
              Name: params.name,
              Type: "post",
              APIEndpoint: params.api_endpoint,
              APIPayload: payload,
              RetriesUntilSuccess: retries,
            };
            break;
          }

          case "deploy": {
            if (!params.bytecode) {
              return err("bytecode is required for deploy actions.", { missing_params: ["bytecode"] });
            }
            const chainId = resolveChainId(params.chain ?? "base sepolia") ?? 84532;
            action = {
              ...actionDefaults(chainId),
              Name: params.name,
              Type: "deploy",
              Bytecode: params.bytecode,
              InitializationArgs: params.constructor_args ?? [],
              ChainID: chainId,
              RetriesUntilSuccess: retries,
            };
            break;
          }

          default:
            return err(`Unknown action type: ${params.type}`);
        }

        const yamlStr = YAML.stringify([action]);
        return ok({ action_yaml: yamlStr, action });
      } catch (e) {
        logger.error({ err: e }, "kwala-build-action error");
        return err(`Failed to build action: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
  );
}

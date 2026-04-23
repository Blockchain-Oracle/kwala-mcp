import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import YAML from "yaml";
import { ok, err } from "../lib/format.js";
import { resolveChainId, getChain } from "../lib/chains.js";
import { resolveToken } from "../lib/tokens.js";
import { getErc20AbiBase64, resolveWellKnownEvent, resolveWellKnownFunction } from "../lib/abi.js";
import { validateWorkflow } from "../lib/schema.js";
import { triggerDefaults, actionDefaults, normalizeExpiresIn, normalizeInterval, cronToInterval } from "../lib/defaults.js";
import { getConfig } from "../lib/wallet.js";
import { logger } from "../lib/logger.js";

export function registerCreateAutomationTool(server: McpServer): void {
  server.registerTool(
    "kwala-create-automation",
    {
      title: "Create Automation",
      description: `Generate a complete, deployable Kwalang YAML workflow from structured parameters. This is the flagship tool — it auto-fetches ABIs, resolves token addresses, and builds the full workflow. The resulting YAML can be passed directly to kwala-verify-workflow and kwala-deploy-workflow.`,
      inputSchema: z.object({
        name: z.string().describe("Workflow name (e.g., 'USDCTransferAlert')."),
        description: z
          .string()
          .optional()
          .describe("Natural language description of what the automation does."),

        // Trigger config
        trigger_type: z
          .enum(["event", "time", "cron", "oracle_price", "block", "address_tracking"])
          .describe("What triggers this workflow."),
        contract_address: z
          .string()
          .optional()
          .describe("Contract or address to watch (for event/address_tracking triggers). Can use token name like 'USDC' which auto-resolves."),
        chain: z
          .string()
          .optional()
          .describe("Chain name or ID (e.g., 'Base', 'Ethereum', '84532'). Default: Base Sepolia."),
        event_name: z
          .string()
          .optional()
          .describe("Event name (e.g., 'Transfer'). Auto-resolved to full signature from ABI."),
        event_filter: z
          .string()
          .optional()
          .describe("Filter expression (e.g., 're.event(2) > 1000'). Default: 'NA'."),
        interval_seconds: z.number().optional().describe("Repeat interval in seconds (for time triggers)."),
        cron_expression: z.string().optional().describe("Cron expression (for cron triggers)."),
        trigger_price: z.number().optional().describe("Price threshold (for oracle_price triggers)."),
        block_number: z.number().optional().describe("Block number (for block triggers)."),
        expires_in: z.string().optional().describe("Expiration in seconds or Unix timestamp."),

        // Actions
        actions: z
          .array(
            z.object({
              name: z.string().describe("Action name."),
              type: z.enum(["call", "notification", "api"]).describe("Action type."),
              // For call
              target_contract: z.string().optional(),
              target_function: z.string().optional(),
              target_params: z.array(z.string()).optional(),
              target_chain: z.string().optional(),
              // For notification
              channel: z.enum(["telegram", "discord", "webhook"]).optional(),
              bot_token: z.string().optional(),
              chat_id: z.string().optional(),
              webhook_url: z.string().optional(),
              message: z.string().optional(),
              // For api
              api_endpoint: z.string().optional(),
              api_payload: z.string().optional(),
              // Common
              retries: z.number().optional(),
            }),
          )
          .min(1)
          .max(10)
          .describe("Array of actions (1-10). Each action can be a contract call, notification, or API call."),

        execution_mode: z
          .enum(["sequential", "parallel"])
          .optional()
          .describe("Action execution mode. Default: sequential."),
        testnet: z
          .boolean()
          .optional()
          .describe("Use testnet chain IDs. Default: true."),
      }),
    },
    async (params) => {
      logger.debug({ name: params.name }, "kwala-create-automation invoked");

      try {
        const testnet = params.testnet ?? true;
        const storedConfig = getConfig();
        const chainInput = params.chain ?? storedConfig.default_chain ?? "base";
        const resolvedChainId = resolveChainId(chainInput, testnet);
        if (!resolvedChainId && params.chain) {
          return err(`Unsupported chain: "${params.chain}". Use kwala-list-chains to see supported chains (Ethereum, Base, Polygon, BNB, Avalanche, Celo + testnets).`, {
            suggestion: "Use kwala-list-chains to see all supported chains and tokens.",
          });
        }
        const chainId = resolvedChainId ?? 84532;
        const chain = getChain(chainId);

        // ── Build Trigger ──
        // Start with all mandatory defaults (Kwala backend requires every field)
        const trigger: Record<string, unknown> = { ...triggerDefaults(chainId) };

        // Resolve contract address (could be a token name like "USDC")
        let contractAddr = params.contract_address;
        if (contractAddr && !contractAddr.startsWith("0x")) {
          const resolved = resolveToken(contractAddr, chainId);
          if (resolved) {
            contractAddr = resolved;
          } else {
            return err(`Token "${contractAddr}" not found on chain ${chain?.name ?? chainId}. Use kwala-list-chains to see supported tokens, or provide the contract address directly (0x...).`, {
              missing_params: ["contract_address"],
            });
          }
        }

        // ── Validate trigger-specific required params ──
        switch (params.trigger_type) {
          case "event":
          case "address_tracking":
            if (!contractAddr) {
              return err(`contract_address is required for ${params.trigger_type} triggers. Provide a 0x address or token name like "USDC".`, {
                missing_params: ["contract_address"],
              });
            }
            break;
          case "oracle_price":
            if (!params.trigger_price) {
              return err("trigger_price is required for oracle_price triggers. E.g., 2000 for $2000.", {
                missing_params: ["trigger_price"],
              });
            }
            break;
          case "block":
            if (!params.block_number) {
              return err("block_number is required for block triggers.", {
                missing_params: ["block_number"],
              });
            }
            break;
          case "time":
            if (!params.interval_seconds) {
              return err("interval_seconds is required for time triggers. E.g., 300 for every 5 minutes.", {
                missing_params: ["interval_seconds"],
              });
            }
            break;
          case "cron":
            if (!params.cron_expression) {
              return err("cron_expression is required for cron triggers. E.g., '0 9 * * *' for daily at 9am.", {
                missing_params: ["cron_expression"],
              });
            }
            break;
        }

        // ── Auto-fill from stored config, then validate ──
        const storedTelegram = storedConfig.notifications?.telegram;
        const storedDiscord = storedConfig.notifications?.discord;

        for (const a of params.actions) {
          // Auto-fill from stored notification config
          if (a.type === "notification") {
            const channel = a.channel ?? "telegram";
            if (channel === "telegram") {
              if (!a.bot_token && storedTelegram?.bot_token) a.bot_token = storedTelegram.bot_token;
              if (!a.chat_id && storedTelegram?.chat_id) a.chat_id = storedTelegram.chat_id;
              if (!a.bot_token) {
                return err("Telegram not configured. Either pass bot_token here, or run kwala-configure with telegram_bot_token and telegram_chat_id to store it once.", {
                  missing_params: ["actions[].bot_token"],
                  suggestion: "Get a bot token from @BotFather on Telegram. Then call kwala-configure to save it.",
                });
              }
              if (!a.chat_id) {
                return err("Telegram chat_id missing. Either pass chat_id here, or run kwala-configure with telegram_chat_id to store it.", {
                  missing_params: ["actions[].chat_id"],
                  suggestion: "Call https://api.telegram.org/bot<TOKEN>/getUpdates to find your chat_id.",
                });
              }
            } else if (channel === "discord") {
              if (!a.webhook_url && storedDiscord?.webhook_url) a.webhook_url = storedDiscord.webhook_url;
              if (!a.webhook_url) {
                return err("Discord not configured. Either pass webhook_url here, or run kwala-configure with discord_webhook_url to store it once.", {
                  missing_params: ["actions[].webhook_url"],
                });
              }
            } else if (channel === "webhook") {
              if (!a.webhook_url) {
                return err("webhook_url is required for webhook notifications.", {
                  missing_params: ["actions[].webhook_url"],
                });
              }
            }
          } else if (a.type === "call") {
            if (!a.target_contract) {
              return err("target_contract is required for call actions. Provide the contract address (0x...).", {
                missing_params: ["actions[].target_contract"],
              });
            }
          } else if (a.type === "api") {
            if (!a.api_endpoint) {
              return err("api_endpoint is required for API actions. Provide the webhook/API URL.", {
                missing_params: ["actions[].api_endpoint"],
              });
            }
          }
        }

        switch (params.trigger_type) {
          case "event": {
            trigger.TriggerSourceContract = contractAddr;
            trigger.TriggerChainID = chainId;
            trigger.RecurringChainID = chainId;
            trigger.TriggerEventFilter = params.event_filter ?? "NA";
            trigger.RecurringEventFilter = "NA";
            trigger.ExecuteAfter = "event";
            trigger.RepeatEvery = "event";

            // Use built-in ERC-20 ABI (works for USDC, USDT, WETH, DAI, etc.)
            trigger.TriggerSourceContractABI = getErc20AbiBase64();

            // Resolve event name to full signature using well-known events
            trigger.TriggerEventName = resolveWellKnownEvent(params.event_name ?? "Transfer");
            break;
          }
          case "time":
            trigger.ExecuteAfter = "immediate";
            trigger.RepeatEvery = normalizeInterval(params.interval_seconds!);
            break;
          case "cron":
            trigger.ExecuteAfter = "immediate";
            trigger.RepeatEvery = cronToInterval(params.cron_expression!);
            break;
          case "oracle_price":
            trigger.TriggerPrice = params.trigger_price;
            trigger.RecurringPrice = params.trigger_price;
            trigger.ExecuteAfter = "oracle_price";
            trigger.RepeatEvery = "oracle_price";
            break;
          case "block":
            trigger.TriggerChainID = chainId;
            trigger.ExecuteAfter = `block:${params.block_number}`;
            trigger.RepeatEvery = `block:${params.block_number}`;
            break;
          case "address_tracking":
            trigger.TriggerSourceContract = contractAddr;
            trigger.TriggerChainID = chainId;
            trigger.ExecuteAfter = "address_tracking";
            trigger.RepeatEvery = "address_tracking";
            break;
        }

        if (params.expires_in) {
          trigger.ExpiresIn = normalizeExpiresIn(params.expires_in);
        } else {
          // Default: 30 days from now
          trigger.ExpiresIn = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
        }

        // ── Build Actions ──
        const actions: Array<Record<string, unknown>> = [];

        for (const a of params.actions) {
          const retries = a.retries ?? 3;

          if (a.type === "call") {
            let funcSig = a.target_function ?? "";
            const targetChainId = a.target_chain
              ? (resolveChainId(a.target_chain, testnet) ?? chainId)
              : chainId;

            if (funcSig && !funcSig.startsWith("function ")) {
              funcSig = resolveWellKnownFunction(funcSig);
            }

            actions.push({
              ...actionDefaults(targetChainId),
              Name: a.name,
              Type: "call",
              TargetContract: a.target_contract!,
              TargetFunction: funcSig,
              TargetParams: a.target_params ?? [],
              ChainID: targetChainId,
              RetriesUntilSuccess: retries,
            });
          } else if (a.type === "notification") {
            const channel = a.channel ?? "telegram";
            let endpoint: string;
            let payload: Record<string, unknown>;

            if (channel === "telegram") {
              endpoint = `https://api.telegram.org/bot${a.bot_token!}/sendMessage`;
              payload = {
                chat_id: a.chat_id!,
                text: a.message ?? "Workflow triggered",
              };
            } else if (channel === "discord") {
              endpoint = a.webhook_url!;
              payload = { content: a.message ?? "Workflow triggered" };
            } else {
              endpoint = a.webhook_url!;
              payload = { message: a.message ?? "Workflow triggered" };
            }

            actions.push({
              ...actionDefaults(chainId),
              Name: a.name,
              Type: "post",
              APIEndpoint: endpoint,
              APIPayload: payload,
              RetriesUntilSuccess: retries,
            });
          } else if (a.type === "api") {
            let payload: Record<string, unknown> = {};
            if (a.api_payload) {
              try { payload = JSON.parse(a.api_payload) as Record<string, unknown>; } catch { /* empty */ }
            }
            actions.push({
              ...actionDefaults(chainId),
              Name: a.name,
              Type: "post",
              APIEndpoint: a.api_endpoint!,
              APIPayload: payload,
              RetriesUntilSuccess: retries,
            });
          }
        }

        // ── Assemble Workflow ──
        const workflow = {
          Name: params.name,
          Trigger: trigger,
          Actions: actions,
          Execution: { Mode: params.execution_mode ?? "sequential" },
        };

        const yamlStr = YAML.stringify(workflow);

        // Validate
        const validation = validateWorkflow(yamlStr);

        // Security and informational warnings
        const warnings: string[] = [];
        if (yamlStr.includes("api.telegram.org/bot")) {
          warnings.push(
            "SECURITY: Your Telegram bot token will be stored on-chain when deployed. Consider using a dedicated bot token for automations.",
          );
        }
        if (yamlStr.includes("discord.com/api/webhooks")) {
          warnings.push(
            "SECURITY: Your Discord webhook URL will be stored on-chain when deployed.",
          );
        }

        // Human-readable expiration
        const expiresTs = trigger.ExpiresIn as number;
        const expiresDate = new Date(expiresTs * 1000).toISOString();

        return ok({
          yaml: yamlStr,
          workflow_name: params.name,
          chain: chain?.name ?? `Chain ${chainId}`,
          chain_id: chainId,
          trigger_type: params.trigger_type,
          actions_count: actions.length,
          execution_mode: params.execution_mode ?? "sequential",
          expires: expiresDate,
          validation: validation.valid
            ? { valid: true }
            : { valid: false, errors: validation.errors },
          warnings: warnings.length > 0 ? warnings : undefined,
          description: params.description ?? null,
          next_steps: [
            "Call kwala-verify-workflow with this YAML to verify against Kwala's backend.",
            "Then call kwala-deploy-workflow to deploy it on-chain.",
          ],
        });
      } catch (e) {
        logger.error({ err: e }, "kwala-create-automation error");
        return err(
          `Failed to create automation: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    },
  );
}

// Helper — imported but not used as a standalone function here
function resolveFunctionSignature(abi: unknown[], name: string): string | undefined {
  for (const item of abi) {
    const entry = item as Record<string, unknown>;
    if (entry.type !== "function" || entry.name !== name) continue;
    const inputs = entry.inputs as Array<{ type: string; name: string }> | undefined;
    if (!inputs) return `function ${name}()`;
    return `function ${name}(${inputs.map((i) => `${i.type} ${i.name}`).join(", ")})`;
  }
  return undefined;
}

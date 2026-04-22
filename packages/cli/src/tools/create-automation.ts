import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import YAML from "yaml";
import { ok, err } from "../lib/format.js";
import { resolveChainId, getChain } from "../lib/chains.js";
import { resolveToken } from "../lib/tokens.js";
import { getErc20AbiBase64, resolveWellKnownEvent, resolveWellKnownFunction } from "../lib/abi.js";
import { validateWorkflow } from "../lib/schema.js";
import { triggerDefaults, actionDefaults, normalizeExpiresIn, normalizeInterval, cronToInterval } from "../lib/defaults.js";
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
        const chainId = resolveChainId(params.chain ?? "base", testnet) ?? 84532;
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
          }
        }

        switch (params.trigger_type) {
          case "event": {
            trigger.TriggerSourceContract = contractAddr ?? "<CONTRACT_ADDRESS>";
            trigger.TriggerChainID = chainId;
            trigger.RecurringChainID = chainId;
            trigger.TriggerEventFilter = params.event_filter ?? "NA";
            trigger.RecurringEventFilter = "NA";
            trigger.ExecuteAfter = "event";
            trigger.RepeatEvery = "event";

            // Use built-in ERC-20 ABI (works for USDC, USDT, WETH, DAI, etc.)
            // No API call needed — we know what standard token ABIs look like
            trigger.TriggerSourceContractABI = getErc20AbiBase64();

            // Resolve event name to full signature using well-known events
            trigger.TriggerEventName = resolveWellKnownEvent(params.event_name ?? "Transfer");
            break;
          }
          case "time":
            trigger.ExecuteAfter = "event";
            trigger.RepeatEvery = normalizeInterval(params.interval_seconds ?? 3600);
            break;
          case "cron":
            // Backend doesn't support cron expressions directly.
            // Convert common cron patterns to interval format.
            trigger.ExecuteAfter = "event";
            trigger.RepeatEvery = cronToInterval(params.cron_expression ?? "0 9 * * *");
            break;
          case "oracle_price":
            trigger.TriggerPrice = params.trigger_price ?? 0;
            trigger.RecurringPrice = params.trigger_price ?? 0;
            trigger.ExecuteAfter = "oracle_price";
            trigger.RepeatEvery = "oracle_price";
            break;
          case "block":
            trigger.ExecuteAfter = `BL${params.block_number ?? 0}`;
            break;
          case "address_tracking":
            trigger.TriggerSourceContract = contractAddr ?? "<ADDRESS_TO_TRACK>";
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

            // Resolve function signature from well-known functions
            if (funcSig && !funcSig.startsWith("function ")) {
              funcSig = resolveWellKnownFunction(funcSig);
            }

            actions.push({
              ...actionDefaults(targetChainId),
              Name: a.name,
              Type: "call",
              TargetContract: a.target_contract ?? "<TARGET_CONTRACT>",
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
              endpoint = `https://api.telegram.org/bot${a.bot_token ?? "<BOT_TOKEN>"}/sendMessage`;
              payload = {
                chat_id: a.chat_id ?? "<CHAT_ID>",
                text: a.message ?? "Workflow triggered",
              };
            } else if (channel === "discord") {
              endpoint = a.webhook_url ?? "<DISCORD_WEBHOOK>";
              payload = { content: a.message ?? "Workflow triggered" };
            } else {
              endpoint = a.webhook_url ?? "<WEBHOOK_URL>";
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
              APIEndpoint: a.api_endpoint ?? "<API_ENDPOINT>",
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

        return ok({
          yaml: yamlStr,
          workflow_name: params.name,
          chain: chain?.name ?? `Chain ${chainId}`,
          chain_id: chainId,
          trigger_type: params.trigger_type,
          actions_count: actions.length,
          execution_mode: params.execution_mode ?? "sequential",
          validation: validation.valid
            ? { valid: true }
            : { valid: false, errors: validation.errors },
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

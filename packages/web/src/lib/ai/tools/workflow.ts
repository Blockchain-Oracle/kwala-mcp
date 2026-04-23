import { tool } from "ai";
import { z } from "zod";
import YAML from "yaml";
import { kwalaPost } from "../kwala-api";
import {
  resolveChainId,
  getChain,
  resolveToken,
  getErc20AbiBase64,
  resolveWellKnownEvent,
  resolveWellKnownFunction,
  triggerDefaults,
  actionDefaults,
  normalizeExpiresIn,
  normalizeInterval,
  cronToInterval,
  validateWorkflow,
  TEMPLATES,
} from "../constants";

// ── createAutomation ────────────────────────────────────────────────────

export const createAutomation = tool({
  description:
    "Generate a complete, deployable Kwalang YAML workflow from structured parameters. Auto-fetches ABIs, resolves token addresses, and builds the full workflow.",
  inputSchema: z.object({
    name: z.string().describe("Workflow name (e.g., 'USDCTransferAlert')."),
    description: z.string().optional().describe("Natural language description."),
    trigger_type: z
      .enum(["event", "time", "cron", "oracle_price", "block", "address_tracking"])
      .describe("What triggers this workflow."),
    contract_address: z
      .string()
      .optional()
      .describe("Contract or address to watch. Can use token name like 'USDC'."),
    chain: z
      .string()
      .optional()
      .describe("Chain name or ID (e.g., 'Base', '84532'). Default: Base Sepolia."),
    event_name: z
      .string()
      .optional()
      .describe("Event name (e.g., 'Transfer'). Auto-resolved to full signature."),
    event_filter: z
      .string()
      .optional()
      .describe("Filter expression (e.g., 're.event(2) > 1000'). Default: 'NA'."),
    interval_seconds: z.number().optional().describe("Repeat interval in seconds (for time triggers)."),
    cron_expression: z.string().optional().describe("Cron expression (for cron triggers)."),
    trigger_price: z.number().optional().describe("Price threshold (for oracle_price triggers)."),
    block_number: z.number().optional().describe("Block number (for block triggers)."),
    expires_in: z.string().optional().describe("Expiration in seconds or Unix timestamp."),
    actions: z
      .array(
        z.object({
          name: z.string().describe("Action name."),
          type: z.enum(["call", "notification", "api"]).describe("Action type."),
          target_contract: z.string().optional(),
          target_function: z.string().optional(),
          target_params: z.array(z.string()).optional(),
          target_chain: z.string().optional(),
          channel: z.enum(["telegram", "discord", "webhook"]).optional(),
          bot_token: z.string().optional(),
          chat_id: z.string().optional(),
          webhook_url: z.string().optional(),
          message: z.string().optional(),
          api_endpoint: z.string().optional(),
          api_payload: z.string().optional(),
          retries: z.number().optional(),
        }),
      )
      .min(1)
      .max(10)
      .describe("Array of actions (1-10)."),
    execution_mode: z.enum(["sequential", "parallel"]).optional().describe("Default: sequential."),
    testnet: z.boolean().optional().describe("Use testnet chain IDs. Default: true."),
  }),
  execute: async (params) => {
    try {
      const testnet = params.testnet ?? true;
      const chainInput = params.chain ?? "base";
      const resolvedChainId = resolveChainId(chainInput, testnet);
      if (!resolvedChainId && params.chain) {
        return {
          error: `Unsupported chain: "${params.chain}". Use listChains to see supported chains.`,
        };
      }
      const chainId = resolvedChainId ?? 84532;
      const chain = getChain(chainId);

      // Build Trigger
      const trigger: Record<string, unknown> = { ...triggerDefaults(chainId) };

      // Resolve contract address — only for triggers that need it
      let contractAddr = params.contract_address;
      const needsContract = params.trigger_type === "event" || params.trigger_type === "address_tracking";

      if (needsContract && contractAddr && !contractAddr.startsWith("0x")) {
        const resolved = resolveToken(contractAddr, chainId);
        if (resolved) {
          contractAddr = resolved;
        } else {
          return {
            error: `Token "${contractAddr}" not found on chain ${chain?.name ?? chainId}. Use listChains to see supported tokens, or provide a 0x address.`,
          };
        }
      }

      // Validate trigger-specific required params
      switch (params.trigger_type) {
        case "event":
        case "address_tracking":
          if (!contractAddr) {
            return { error: `contract_address is required for ${params.trigger_type} triggers.` };
          }
          break;
        case "oracle_price":
          if (!params.trigger_price) {
            return { error: "trigger_price is required for oracle_price triggers. No contract_address needed." };
          }
          break;
        case "block":
          if (!params.block_number) {
            return { error: "block_number is required for block triggers." };
          }
          break;
        case "time":
          if (!params.interval_seconds) {
            return { error: "interval_seconds is required for time triggers." };
          }
          break;
        case "cron":
          if (!params.cron_expression) {
            return { error: "cron_expression is required for cron triggers." };
          }
          break;
      }

      // Validate actions
      for (const a of params.actions) {
        if (a.type === "notification") {
          const channel = a.channel ?? "telegram";
          if (channel === "telegram" && !a.bot_token) {
            return { error: "Telegram bot_token is required for telegram notifications." };
          }
          if (channel === "telegram" && !a.chat_id) {
            return { error: "Telegram chat_id is required." };
          }
          if (channel === "discord" && !a.webhook_url) {
            return { error: "Discord webhook_url is required." };
          }
          if (channel === "webhook" && !a.webhook_url) {
            return { error: "webhook_url is required for webhook notifications." };
          }
        } else if (a.type === "call" && !a.target_contract) {
          return { error: "target_contract is required for call actions." };
        } else if (a.type === "api" && !a.api_endpoint) {
          return { error: "api_endpoint is required for API actions." };
        }
      }

      // Set trigger fields based on type
      switch (params.trigger_type) {
        case "event":
          trigger.TriggerSourceContract = contractAddr;
          trigger.TriggerChainID = chainId;
          trigger.RecurringChainID = chainId;
          trigger.TriggerEventFilter = params.event_filter ?? "NA";
          trigger.RecurringEventFilter = "NA";
          trigger.ExecuteAfter = "event";
          trigger.RepeatEvery = "event";
          trigger.TriggerSourceContractABI = getErc20AbiBase64();
          trigger.TriggerEventName = resolveWellKnownEvent(params.event_name ?? "Transfer");
          break;
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
        trigger.ExpiresIn = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      }

      // Build Actions
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
            payload = { chat_id: a.chat_id!, text: a.message ?? "Workflow triggered" };
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
            try {
              payload = JSON.parse(a.api_payload) as Record<string, unknown>;
            } catch {
              /* empty */
            }
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

      // Assemble Workflow
      const workflow = {
        Name: params.name,
        Trigger: trigger,
        Actions: actions,
        Execution: { Mode: params.execution_mode ?? "sequential" },
      };

      const yamlStr = YAML.stringify(workflow);
      const validation = validateWorkflow(yamlStr);

      const warnings: string[] = [];
      if (yamlStr.includes("api.telegram.org/bot")) {
        warnings.push("SECURITY: Your Telegram bot token will be stored on-chain when deployed.");
      }
      if (yamlStr.includes("discord.com/api/webhooks")) {
        warnings.push("SECURITY: Your Discord webhook URL will be stored on-chain when deployed.");
      }

      const expiresTs = trigger.ExpiresIn as number;
      const expiresDate = new Date(expiresTs * 1000).toISOString();

      return {
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
          "Call verifyWorkflow with this YAML to verify against Kwala's backend.",
          "Then call prepareDeploy to deploy it via your connected wallet.",
        ],
      };
    } catch (e) {
      return { error: `Failed to create automation: ${e instanceof Error ? e.message : String(e)}` };
    }
  },
});

// ── verifyWorkflow ──────────────────────────────────────────────────────

export const verifyWorkflow = tool({
  description:
    "Verify a Kwalang YAML workflow against Kwala's backend API. If valid, the workflow is ready to deploy.",
  inputSchema: z.object({
    yaml: z.string().describe("The Kwalang YAML workflow to verify."),
    user_address: z.string().optional().describe("Wallet address for verification context."),
  }),
  execute: async ({ yaml: yamlStr, user_address }) => {
    const local = validateWorkflow(yamlStr);
    if (!local.valid) {
      return { error: `Local validation failed: ${local.errors?.join("; ")}` };
    }

    try {
      const result = await kwalaPost<{
        syntax_check: boolean;
        schema_validation: boolean;
        error?: string;
      }>("/workflow/verify", {
        yaml: yamlStr,
        user_address: user_address ?? "0x0000000000000000000000000000000000000000",
      });

      if (result.syntax_check && result.schema_validation) {
        return {
          verified: true,
          syntax_check: true,
          schema_validation: true,
          workflow_name: local.parsed?.Name,
          ready_to_deploy: true,
        };
      }

      return { error: `Kwala verification failed: ${result.error ?? "Check YAML structure."}` };
    } catch (e) {
      return { error: `Verification failed: ${e instanceof Error ? e.message : String(e)}` };
    }
  },
});

// ── listTemplates ───────────────────────────────────────────────────────

export const listTemplates = tool({
  description:
    "Browse pre-built Kwalang workflow templates. Filter by category or search by keyword.",
  inputSchema: z.object({
    category: z
      .enum(["alerts", "defi", "nft", "monitoring", "notifications", "all"])
      .optional()
      .describe("Filter by category. Default: all"),
    search: z.string().optional().describe("Search by keyword."),
  }),
  execute: async ({ category, search }) => {
    let results = TEMPLATES;

    if (category && category !== "all") {
      results = results.filter((t) => t.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.yaml.toLowerCase().includes(q),
      );
    }

    return {
      count: results.length,
      templates: results.map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        description: t.description,
        trigger_type: t.trigger_type,
        actions: t.actions,
        chains: t.chains,
        yaml: t.yaml,
      })),
    };
  },
});

// ── explainYaml ─────────────────────────────────────────────────────────

export const explainYaml = tool({
  description:
    "Explain a Kwalang YAML workflow in plain English. Parses triggers, actions, and execution mode.",
  inputSchema: z.object({
    yaml: z.string().describe("Raw Kwalang YAML workflow string."),
  }),
  execute: async ({ yaml: yamlStr }) => {
    try {
      const parsed = YAML.parse(yamlStr);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { error: "Not a valid Kwalang workflow." };
      }
      const wf = parsed as Record<string, unknown>;
      if (!wf.Name && !wf.Trigger && !wf.Actions) {
        return { error: "Missing Name, Trigger, and Actions fields." };
      }

      const name = wf.Name as string;
      const trigger = wf.Trigger as Record<string, unknown> | undefined;
      const actions = wf.Actions as Array<Record<string, unknown>> | undefined;
      const execution = wf.Execution as Record<string, unknown> | undefined;

      const result: Record<string, unknown> = { workflow_name: name };

      if (trigger) {
        const parts: string[] = [];
        const executeAfter = String(trigger.ExecuteAfter ?? "");
        const repeatEvery = String(trigger.RepeatEvery ?? "");

        if (executeAfter === "event" || repeatEvery === "event") {
          const contract = trigger.TriggerSourceContract as string | undefined;
          const chainId = trigger.TriggerChainID as number | undefined;
          const eventName = trigger.TriggerEventName as string | undefined;
          const chainInfo = chainId ? getChain(chainId) : undefined;
          if (eventName && contract) {
            parts.push(`Watches for "${eventName}" events on contract ${contract}${chainInfo ? ` (${chainInfo.name})` : ""}.`);
          }
        } else if (executeAfter === "oracle_price") {
          const price = trigger.TriggerPrice as number | undefined;
          parts.push(`Triggers when price reaches $${price ?? "threshold"}.`);
        } else if (executeAfter === "address_tracking") {
          const contract = trigger.TriggerSourceContract as string | undefined;
          parts.push(`Tracks all activity on address ${contract ?? "unknown"}.`);
        }
        result.trigger = parts.join(" ") || "Trigger details not recognized.";
      }

      if (actions && Array.isArray(actions)) {
        result.actions = actions.map((a, i) => {
          const aResult: Record<string, string> = { action: `#${i + 1}: "${a.Name}"` };
          if (a.Type === "call") {
            aResult.type = "Smart contract call";
            aResult.description = `Calls ${a.TargetFunction} on ${a.TargetContract}`;
          } else if (a.Type === "post" || a.Type === "api") {
            aResult.type = "API call";
            aResult.description = `POST to ${a.APIEndpoint}`;
          }
          return aResult;
        });
      }

      if (execution) {
        result.execution =
          execution.Mode === "parallel"
            ? "All actions execute in parallel."
            : "Actions execute sequentially.";
      }

      return result;
    } catch (e) {
      return { error: `Failed to parse YAML: ${e instanceof Error ? e.message : String(e)}` };
    }
  },
});

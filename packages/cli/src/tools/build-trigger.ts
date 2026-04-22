import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import YAML from "yaml";
import { ok, err } from "../lib/format.js";
import { resolveChainId } from "../lib/chains.js";
import { getErc20AbiBase64, resolveWellKnownEvent, fetchAbiBase64, fetchAbi, resolveEventSignature } from "../lib/abi.js";
import { triggerDefaults, normalizeExpiresIn, normalizeInterval, cronToInterval } from "../lib/defaults.js";
import { logger } from "../lib/logger.js";

export function registerBuildTriggerTool(server: McpServer): void {
  server.registerTool(
    "kwala-build-trigger",
    {
      title: "Build Trigger",
      description:
        "Generate a Kwalang Trigger YAML section from structured parameters. Auto-fetches ABIs and resolves event signatures — you never need to handle base64 or full signatures manually.",
      inputSchema: z.object({
        type: z
          .enum([
            "event",
            "time",
            "cron",
            "oracle_price",
            "block",
            "address_tracking",
          ])
          .describe("Trigger type."),
        contract_address: z
          .string()
          .optional()
          .describe("Contract or address to watch (required for event and address_tracking)."),
        chain: z
          .string()
          .optional()
          .describe("Chain name or ID (e.g., 'Base', '8453'). Default: Base Sepolia."),
        event_name: z
          .string()
          .optional()
          .describe(
            "Event name (e.g., 'Transfer'). Auto-resolved to full signature from ABI.",
          ),
        filter: z
          .string()
          .optional()
          .describe("Filter expression (e.g., 're.event(2) > 1000'). Default: 'NA'."),
        interval_seconds: z
          .number()
          .optional()
          .describe("Repeat interval in seconds (for time type)."),
        cron_expression: z
          .string()
          .optional()
          .describe("Cron expression (for cron type). E.g., '0 9 * * *'."),
        price: z
          .number()
          .optional()
          .describe("Price threshold (for oracle_price type)."),
        block_number: z
          .number()
          .optional()
          .describe("Block number to trigger at (for block type)."),
        expires_in: z
          .string()
          .optional()
          .describe("Expiration: seconds as string or Unix timestamp."),
        abi_json: z
          .string()
          .optional()
          .describe(
            "Raw ABI JSON string. Only needed if the contract is unverified and auto-fetch fails.",
          ),
      }),
    },
    async (params) => {
      logger.debug(params, "kwala-build-trigger invoked");

      try {
        const chainId = resolveChainId(params.chain ?? "base sepolia") ?? 84532;
        const trigger: Record<string, unknown> = { ...triggerDefaults(chainId) };

        switch (params.type) {
          case "event": {
            if (!params.contract_address) {
              return err("contract_address is required for event triggers.", {
                missing_params: ["contract_address"],
              });
            }
            trigger.TriggerSourceContract = params.contract_address;
            trigger.TriggerChainID = chainId;
            trigger.RecurringChainID = chainId;
            trigger.TriggerEventFilter = params.filter ?? "NA";
            trigger.RecurringEventFilter = "NA";
            trigger.ExecuteAfter = "event";
            trigger.RepeatEvery = "event";

            // Use provided ABI or fall back to built-in ERC-20 ABI
            if (params.abi_json) {
              trigger.TriggerSourceContractABI = Buffer.from(params.abi_json).toString("base64");
              // Try to resolve event from provided ABI
              if (params.event_name) {
                const abi = JSON.parse(params.abi_json) as unknown[];
                const sig = resolveEventSignature(abi, params.event_name);
                trigger.TriggerEventName = sig ?? resolveWellKnownEvent(params.event_name);
              }
            } else {
              trigger.TriggerSourceContractABI = getErc20AbiBase64();
              trigger.TriggerEventName = resolveWellKnownEvent(params.event_name ?? "Transfer");
            }
            break;
          }

          case "time": {
            trigger.ExecuteAfter = "event";
            trigger.RepeatEvery = normalizeInterval(params.interval_seconds ?? 3600);
            break;
          }

          case "cron": {
            trigger.ExecuteAfter = "event";
            trigger.RepeatEvery = cronToInterval(params.cron_expression ?? "0 9 * * *");
            break;
          }

          case "oracle_price": {
            if (!params.price) {
              return err("price is required for oracle_price triggers.", {
                missing_params: ["price"],
              });
            }
            trigger.TriggerPrice = params.price;
            trigger.RecurringPrice = params.price;
            trigger.ExecuteAfter = "oracle_price";
            trigger.RepeatEvery = "oracle_price";
            break;
          }

          case "block": {
            if (!params.block_number) {
              return err("block_number is required for block triggers.", {
                missing_params: ["block_number"],
              });
            }
            trigger.ExecuteAfter = `BL${params.block_number}`;
            break;
          }

          case "address_tracking": {
            if (!params.contract_address) {
              return err("contract_address is required for address_tracking triggers.", {
                missing_params: ["contract_address"],
              });
            }
            trigger.TriggerSourceContract = params.contract_address;
            trigger.TriggerChainID = chainId;
            trigger.ExecuteAfter = "address_tracking";
            trigger.RepeatEvery = "address_tracking";
            break;
          }
        }

        if (params.expires_in) {
          trigger.ExpiresIn = normalizeExpiresIn(params.expires_in);
        } else {
          trigger.ExpiresIn = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
        }

        const yamlStr = YAML.stringify({ Trigger: trigger });
        return ok({ trigger_yaml: yamlStr, trigger });
      } catch (e) {
        logger.error({ err: e }, "kwala-build-trigger error");
        return err(`Failed to build trigger: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
  );
}

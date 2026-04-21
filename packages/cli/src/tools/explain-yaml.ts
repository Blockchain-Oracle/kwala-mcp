import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import YAML from "yaml";
import { ok, err } from "../lib/format.js";
import { kwalaGet } from "../lib/api.js";
import { getAddress } from "../lib/wallet.js";
import { getChain } from "../lib/chains.js";
import { logger } from "../lib/logger.js";

export function registerExplainYamlTool(server: McpServer): void {
  server.registerTool(
    "kwala-explain-yaml",
    {
      title: "Explain Workflow",
      description:
        "Explain a Kwalang YAML workflow in plain English. Accepts raw YAML or a workflow ID to fetch and explain.",
      inputSchema: z.object({
        yaml: z
          .string()
          .optional()
          .describe("Raw Kwalang YAML workflow string."),
        workflow_id: z
          .string()
          .optional()
          .describe(
            "Workflow ID to fetch and explain. Accepts original name or full ID.",
          ),
      }),
    },
    async ({ yaml, workflow_id }) => {
      logger.debug("kwala-explain-yaml invoked");

      let yamlStr = yaml;

      if (!yamlStr && workflow_id) {
        try {
          let fullId = workflow_id;
          if (!workflow_id.includes("_0x")) {
            fullId = `${workflow_id}_${getAddress()}`;
          }
          const data = await kwalaGet<unknown>(`/workflow/yaml/${fullId}`);
          yamlStr = typeof data === "string" ? data : JSON.stringify(data);
        } catch (e) {
          return err(
            `Could not fetch workflow: ${e instanceof Error ? e.message : String(e)}`,
            { suggestion: "Provide the YAML directly using the yaml parameter." },
          );
        }
      }

      if (!yamlStr) {
        return err("Provide either yaml or workflow_id.", {
          missing_params: ["yaml", "workflow_id"],
        });
      }

      try {
        const parsed = YAML.parse(yamlStr) as Record<string, unknown>;
        return ok(explain(parsed));
      } catch (e) {
        return err(
          `Failed to parse YAML: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    },
  );
}

function explain(wf: Record<string, unknown>): Record<string, unknown> {
  const name = wf.Name as string;
  const trigger = wf.Trigger as Record<string, unknown> | undefined;
  const actions = wf.Actions as Array<Record<string, unknown>> | undefined;
  const execution = wf.Execution as Record<string, unknown> | undefined;

  const result: Record<string, unknown> = { workflow_name: name };

  // Trigger explanation
  if (trigger) {
    result.trigger = explainTrigger(trigger);
  }

  // Actions explanation
  if (actions && Array.isArray(actions)) {
    result.actions = actions.map((a, i) => explainAction(a, i + 1));
  }

  // Execution
  if (execution) {
    const mode = execution.Mode as string;
    result.execution =
      mode === "parallel"
        ? "All actions execute in parallel (simultaneously)."
        : "Actions execute sequentially (one after another).";
  }

  return result;
}

function explainTrigger(t: Record<string, unknown>): string {
  const parts: string[] = [];

  const executeAfter = String(t.ExecuteAfter ?? "");
  const repeatEvery = String(t.RepeatEvery ?? "");

  if (executeAfter === "event" || repeatEvery === "event") {
    const contract = t.TriggerSourceContract as string | undefined;
    const chainId = t.TriggerChainID as number | undefined;
    const eventName = t.TriggerEventName as string | undefined;
    const chain = chainId ? getChain(chainId) : undefined;

    if (eventName && contract) {
      parts.push(
        `Watches for "${eventName}" events on contract ${contract}${chain ? ` (${chain.name}, chain ${chainId})` : ""}.`,
      );
    } else if (contract) {
      parts.push(`Watches contract ${contract}${chain ? ` on ${chain.name}` : ""}.`);
    }

    const filter = t.TriggerEventFilter as string | undefined;
    if (filter && filter !== "NA") {
      parts.push(`Filter: ${filter}`);
    }

    parts.push("Fires every time the event occurs.");
  } else if (executeAfter === "oracle_price" || repeatEvery === "oracle_price") {
    const price = t.TriggerPrice as number | undefined;
    parts.push(
      `Triggers when oracle price ${price ? `reaches $${price}` : "matches condition"}.`,
    );
  } else if (executeAfter === "address_tracking" || repeatEvery === "address_tracking") {
    const contract = t.TriggerSourceContract as string | undefined;
    const chainId = t.TriggerChainID as number | undefined;
    const chain = chainId ? getChain(chainId) : undefined;
    parts.push(
      `Tracks all activity on address ${contract ?? "unknown"}${chain ? ` on ${chain.name}` : ""}.`,
    );
  } else if (
    executeAfter.startsWith("block:")
  ) {
    parts.push(`Triggers after block ${executeAfter.replace("block:", "")}.`);
  } else if (typeof t.RepeatEvery === "number") {
    parts.push(`Repeats every ${t.RepeatEvery} seconds.`);
  } else if (
    typeof repeatEvery === "string" &&
    repeatEvery.includes("*")
  ) {
    parts.push(`Runs on cron schedule: ${repeatEvery}`);
  }

  const expires = t.ExpiresIn;
  if (expires) {
    parts.push(`Expires: ${expires}`);
  }

  return parts.join(" ") || "Trigger details not recognized.";
}

function explainAction(
  a: Record<string, unknown>,
  index: number,
): Record<string, string> {
  const name = a.Name as string;
  const type = a.Type as string;

  const result: Record<string, string> = {
    action: `#${index}: "${name}"`,
  };

  if (type === "call") {
    const contract = a.TargetContract as string;
    const func = a.TargetFunction as string;
    const chainId = a.ChainID as number | undefined;
    const chain = chainId ? getChain(chainId) : undefined;
    result.type = "Smart contract call";
    result.description = `Calls ${func} on ${contract}${chain ? ` (${chain.name})` : ""}`;
  } else if (type === "post" || type === "api") {
    const endpoint = a.APIEndpoint as string;
    result.type = "API call";
    result.description = `POST to ${endpoint}`;
  } else if (type === "deploy") {
    const chainId = a.ChainID as number | undefined;
    const chain = chainId ? getChain(chainId) : undefined;
    result.type = "Contract deployment";
    result.description = `Deploys a new smart contract${chain ? ` on ${chain.name}` : ""}`;
  }

  const retries = a.RetriesUntilSuccess as number | undefined;
  if (retries) {
    result.retries = `${retries} retries on failure`;
  }

  return result;
}

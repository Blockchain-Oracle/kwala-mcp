import { tool } from "ai";
import { z } from "zod";
import { kwalaGet } from "../kwala-api";
import { resolveChainId } from "../constants";

// ── explorerStats ───────────────────────────────────────────────────────

export const explorerStats = tool({
  description:
    "Get live network-wide statistics from the Kwala Explorer: total action executions and deployed workflows.",
  inputSchema: z.object({
    user_address: z.string().optional().describe("Filter stats by wallet address."),
    workflow_name: z.string().optional().describe("Filter stats by workflow name."),
  }),
  execute: async ({ user_address, workflow_name }) => {
    try {
      const countParams: Record<string, string> = {};
      if (user_address) countParams.user_address = user_address;
      if (workflow_name) countParams.workflow_name = workflow_name;

      const [actionsCount, workflowsCount] = await Promise.all([
        kwalaGet<unknown>("/explorer/actions/count", countParams),
        kwalaGet<unknown>("/explorer/workflows/deployed/count"),
      ]);

      return {
        total_actions_executed: actionsCount,
        total_workflows_deployed: workflowsCount,
        filtered_by: user_address || workflow_name || null,
      };
    } catch (e) {
      return { error: `Failed to fetch explorer stats: ${e instanceof Error ? e.message : String(e)}` };
    }
  },
});

// ── explorerActions ─────────────────────────────────────────────────────

export const explorerActions = tool({
  description:
    "Browse recent workflow action executions from the Kwala Explorer. Paginated.",
  inputSchema: z.object({
    page: z.number().optional().describe("Page number. Default: 1"),
    page_size: z.number().optional().describe("Results per page (max 50). Default: 10"),
    user_address: z.string().optional().describe("Filter by wallet address."),
  }),
  execute: async ({ page, page_size, user_address }) => {
    const p = page ?? 1;
    const ps = Math.min(page_size ?? 10, 50);

    try {
      const params: Record<string, string | number> = { page: p, page_size: ps };
      if (user_address) params.user_address = user_address;

      const data = await kwalaGet("/explorer/actions", params);
      return data;
    } catch (e) {
      return { error: `Failed to fetch actions: ${e instanceof Error ? e.message : String(e)}` };
    }
  },
});

// ── getWorkflow ─────────────────────────────────────────────────────────

export const getWorkflow = tool({
  description:
    "Fetch the full YAML definition of a deployed workflow by its ID.",
  inputSchema: z.object({
    workflow_id: z
      .string()
      .describe("Workflow ID (e.g., 'MyWorkflow_0xABC') or just the name."),
    user_address: z.string().optional().describe("Wallet address to append if only name provided."),
  }),
  execute: async ({ workflow_id, user_address }) => {
    let fullId = workflow_id;
    if (!workflow_id.includes("_0x") && user_address) {
      fullId = `${workflow_id}_${user_address}`;
    }

    try {
      const data = await kwalaGet(`/workflow/yaml/${fullId}`);
      return { workflow_id: fullId, yaml: data };
    } catch (e) {
      return { error: `Failed to fetch workflow: ${e instanceof Error ? e.message : String(e)}` };
    }
  },
});

// ── fetchAbi ────────────────────────────────────────────────────────────

export const fetchAbi = tool({
  description:
    "Fetch the ABI for any smart contract on any Kwala-supported chain. Returns events and functions.",
  inputSchema: z.object({
    address: z.string().describe("Contract address (0x...)"),
    chain: z.string().describe("Chain name or ID (e.g., 'Base', '8453')."),
  }),
  execute: async ({ address, chain }) => {
    const chainId =
      resolveChainId(chain, true) ?? resolveChainId(chain, false) ?? Number(chain);
    if (Number.isNaN(chainId)) {
      return { error: `Unknown chain: ${chain}. Use listChains to see supported chains.` };
    }

    try {
      const result = await kwalaGet<unknown>("/contract/fetchABI", {
        chain_id: String(chainId),
        chaincode_address: address,
      });

      const abi = Array.isArray(result)
        ? result
        : Array.isArray((result as Record<string, unknown>)?.abi)
          ? ((result as Record<string, unknown>).abi as unknown[])
          : [];

      if (abi.length === 0) {
        return { error: `No ABI found for ${address} on chain ${chainId}. Contract may not be verified.` };
      }

      // Extract events and functions
      const events: Array<{ name: string; signature: string }> = [];
      const functions: Array<{ name: string; signature: string }> = [];

      for (const item of abi) {
        const entry = item as Record<string, unknown>;
        if (entry.type === "event") {
          const name = entry.name as string;
          const inputs = entry.inputs as Array<{ type: string }> | undefined;
          const sig = inputs ? `${name}(${inputs.map((i) => i.type).join(",")})` : `${name}()`;
          events.push({ name, signature: sig });
        } else if (entry.type === "function") {
          const name = entry.name as string;
          const inputs = entry.inputs as Array<{ type: string; name: string }> | undefined;
          const sig = inputs
            ? `function ${name}(${inputs.map((i) => `${i.type} ${i.name}`).join(", ")})`
            : `function ${name}()`;
          functions.push({ name, signature: sig });
        }
      }

      return { address, chain_id: chainId, abi, events, functions };
    } catch (e) {
      return { error: `Failed to fetch ABI: ${e instanceof Error ? e.message : String(e)}` };
    }
  },
});

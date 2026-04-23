import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ok } from "../lib/format.js";

export function registerToolsListTool(server: McpServer): void {
  server.registerTool(
    "kwala-tools",
    {
      title: "List All Kwala Tools",
      description: "Returns a categorized list of all 19 MCP tools available in kwala-mcp.",
      inputSchema: z.object({}),
    },
    async () => {
      return ok({
        "Workflow Generation": [
          { tool: "kwala-create-automation", description: "Generate a complete Kwalang YAML workflow from natural language" },
          { tool: "kwala-explain-yaml", description: "Explain a workflow in plain English" },
          { tool: "kwala-list-templates", description: "Browse pre-built workflow templates" },
          { tool: "kwala-build-trigger", description: "Generate a trigger configuration" },
          { tool: "kwala-build-action", description: "Generate an action configuration" },
        ],
        "Deployment": [
          { tool: "kwala-verify-workflow", description: "Verify YAML via Kwala's backend API" },
          { tool: "kwala-deploy-workflow", description: "Deploy and activate a workflow on-chain" },
          { tool: "kwala-workflow-status", description: "Check workflow deployment and execution status" },
          { tool: "kwala-list-workflows", description: "List your deployed workflows" },
        ],
        "Explorer": [
          { tool: "kwala-explorer-stats", description: "Kwala network statistics" },
          { tool: "kwala-explorer-actions", description: "Browse execution logs" },
          { tool: "kwala-get-workflow", description: "Fetch a deployed workflow's YAML by ID" },
          { tool: "kwala-fetch-abi", description: "Fetch a contract's ABI for any chain" },
        ],
        "Account": [
          { tool: "kwala-wallet", description: "Show/create your KWALA chain wallet" },
          { tool: "kwala-credit-balance", description: "Check Kwala credit balance" },
          { tool: "kwala-configure", description: "Store Telegram/Discord/webhook settings (set once, auto-used everywhere)" },
          { tool: "kwala-login", description: "Authenticate with Kwala via Google OAuth (required for workflow activation)" },
        ],
        "System": [
          { tool: "kwala-list-chains", description: "List all supported chains" },
          { tool: "kwala-tools", description: "This list" },
        ],
      });
    },
  );
}

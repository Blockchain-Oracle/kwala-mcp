import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadOrCreateWallet } from "./lib/wallet.js";
import { logger } from "./lib/logger.js";

// System tools
import { registerToolsListTool } from "./tools/tools-list.js";
import { registerListChainsTool } from "./tools/list-chains.js";

// Account tools
import { registerWalletTool } from "./tools/wallet.js";
import { registerCreditBalanceTool } from "./tools/credit-balance.js";

// Explorer tools
import { registerExplorerStatsTool } from "./tools/explorer-stats.js";
import { registerExplorerActionsTool } from "./tools/explorer-actions.js";
import { registerGetWorkflowTool } from "./tools/get-workflow.js";
import { registerFetchAbiTool } from "./tools/fetch-abi.js";

export function createMcpServer(): McpServer {
  loadOrCreateWallet();

  const server = new McpServer(
    { name: "kwala-mcp", version: "0.1.0" },
    { capabilities: { tools: {}, logging: {} } },
  );

  // ── System ──
  registerToolsListTool(server);
  registerListChainsTool(server);

  // ── Account ──
  registerWalletTool(server);
  registerCreditBalanceTool(server);

  // ── Explorer ──
  registerExplorerStatsTool(server);
  registerExplorerActionsTool(server);
  registerGetWorkflowTool(server);
  registerFetchAbiTool(server);

  // ── Workflow Generation (Phase 4) ──
  // registerCreateAutomationTool(server);
  // registerExplainYamlTool(server);
  // registerListTemplatesTool(server);
  // registerBuildTriggerTool(server);
  // registerBuildActionTool(server);

  // ── Deployment (Phase 4) ──
  // registerVerifyWorkflowTool(server);
  // registerDeployWorkflowTool(server);
  // registerWorkflowStatusTool(server);
  // registerListWorkflowsTool(server);

  logger.info("Kwala MCP server created with 8 tools");
  return server;
}

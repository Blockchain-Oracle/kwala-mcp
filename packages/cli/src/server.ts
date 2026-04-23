import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadOrCreateWallet } from "./lib/wallet.js";
import { logger } from "./lib/logger.js";

// System
import { registerToolsListTool } from "./tools/tools-list.js";
import { registerListChainsTool } from "./tools/list-chains.js";

// Account
import { registerWalletTool } from "./tools/wallet.js";
import { registerCreditBalanceTool } from "./tools/credit-balance.js";
import { registerConfigureTool } from "./tools/configure.js";
import { registerLoginTool } from "./tools/login.js";

// Explorer
import { registerExplorerStatsTool } from "./tools/explorer-stats.js";
import { registerExplorerActionsTool } from "./tools/explorer-actions.js";
import { registerGetWorkflowTool } from "./tools/get-workflow.js";
import { registerFetchAbiTool } from "./tools/fetch-abi.js";

// Workflow Generation
import { registerCreateAutomationTool } from "./tools/create-automation.js";
import { registerExplainYamlTool } from "./tools/explain-yaml.js";
import { registerListTemplatesTool } from "./tools/list-templates.js";
import { registerBuildTriggerTool } from "./tools/build-trigger.js";
import { registerBuildActionTool } from "./tools/build-action.js";

// Deployment
import { registerVerifyWorkflowTool } from "./tools/verify-workflow.js";
import { registerDeployWorkflowTool } from "./tools/deploy-workflow.js";
import { registerDeactivateWorkflowTool } from "./tools/deactivate-workflow.js";
import { registerWorkflowStatusTool } from "./tools/workflow-status.js";
import { registerListWorkflowsTool } from "./tools/list-workflows.js";

export function createMcpServer(): McpServer {
  loadOrCreateWallet();

  const server = new McpServer(
    { name: "kwala-mcp", version: "0.1.0" },
    { capabilities: { tools: {}, logging: {} } },
  );

  // ── Workflow Generation (5) ──
  registerCreateAutomationTool(server);
  registerExplainYamlTool(server);
  registerListTemplatesTool(server);
  registerBuildTriggerTool(server);
  registerBuildActionTool(server);

  // ── Deployment (4) ──
  registerVerifyWorkflowTool(server);
  registerDeployWorkflowTool(server);
  registerDeactivateWorkflowTool(server);
  registerWorkflowStatusTool(server);
  registerListWorkflowsTool(server);

  // ── Explorer (4) ──
  registerExplorerStatsTool(server);
  registerExplorerActionsTool(server);
  registerGetWorkflowTool(server);
  registerFetchAbiTool(server);

  // ── Account (4) ──
  registerWalletTool(server);
  registerCreditBalanceTool(server);
  registerConfigureTool(server);
  registerLoginTool(server);

  // ── System (2) ──
  registerToolsListTool(server);
  registerListChainsTool(server);

  logger.info("kwala-mcp: 20 tools registered");
  return server;
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { logger } from "./lib/logger.js";

export function createMcpServer(): McpServer {
  const server = new McpServer(
    { name: "kwala-mcp", version: "0.1.0" },
    { capabilities: { tools: {}, logging: {} } },
  );

  // Tools will be registered here as they are built
  // Phase 3: Simple tools
  // Phase 4: Workflow generation + deployment tools

  logger.info("Kwala MCP server created");
  return server;
}

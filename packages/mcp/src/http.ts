#!/usr/bin/env node
import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "@kwala-dev/cli";

const PORT = Number(process.env.MCP_HTTP_PORT ?? 3001);

async function main(): Promise<void> {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Map of sessionId -> transport
  const transports = new Map<string, StreamableHTTPServerTransport>();

  app.post("/mcp", async (req, res) => {
    const sessionId =
      (req.headers["mcp-session-id"] as string) ?? randomUUID();

    let transport = transports.get(sessionId);

    if (!transport) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId,
      });

      transports.set(sessionId, transport);

      const server = createMcpServer();
      await server.connect(transport);

      // Clean up on close
      transport.onclose = () => {
        transports.delete(sessionId);
      };
    }

    await transport.handleRequest(req, res, req.body);
  });

  // Handle GET for SSE stream (session resumption)
  app.get("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string;
    const transport = sessionId ? transports.get(sessionId) : undefined;
    if (!transport) {
      res.status(400).json({ error: "No active session" });
      return;
    }
    await transport.handleRequest(req, res);
  });

  // Handle DELETE for session cleanup
  app.delete("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string;
    const transport = sessionId ? transports.get(sessionId) : undefined;
    if (!transport) {
      res.status(400).json({ error: "No active session" });
      return;
    }
    await transport.handleRequest(req, res);
  });

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", sessions: transports.size });
  });

  app.listen(PORT, () => {
    process.stderr.write(
      `[kwala-mcp] HTTP transport listening on http://localhost:${PORT}/mcp\n`
    );
  });
}

main().catch((error: unknown) => {
  process.stderr.write(
    `[kwala-mcp] fatal: ${error instanceof Error ? error.stack ?? error.message : String(error)}\n`
  );
  process.exit(1);
});

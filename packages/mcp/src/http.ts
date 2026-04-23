#!/usr/bin/env node
import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer } from "@kwala-dev/cli";

const PORT = Number(process.env.MCP_HTTP_PORT ?? 3001);

async function main(): Promise<void> {
  const app = express();
  app.use(cors({
    exposedHeaders: ["Mcp-Session-Id"],
    origin: "*",
  }));
  app.use(express.json());

  const transports = new Map<string, StreamableHTTPServerTransport>();

  app.post("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (sessionId && transports.has(sessionId)) {
      const transport = transports.get(sessionId)!;
      await transport.handleRequest(req, res, req.body);
      return;
    }

    if (!sessionId && isInitializeRequest(req.body)) {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          transports.set(sid, transport);
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          transports.delete(transport.sessionId);
        }
      };

      const server = createMcpServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    res.status(400).json({ error: "Invalid request: no session ID or not an initialize request" });
  });

  app.get("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string;
    const transport = sessionId ? transports.get(sessionId) : undefined;
    if (!transport) {
      res.status(400).json({ error: "No active session" });
      return;
    }
    await transport.handleRequest(req, res);
  });

  app.delete("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string;
    const transport = sessionId ? transports.get(sessionId) : undefined;
    if (!transport) {
      res.status(400).json({ error: "No active session" });
      return;
    }
    await transport.handleRequest(req, res);
  });

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

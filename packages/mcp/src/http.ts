#!/usr/bin/env node
import express from "express";
import cors from "cors";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createMcpServer } from "@kwala-dev/cli";

const PORT = Number(process.env.MCP_HTTP_PORT ?? 3001);

async function main(): Promise<void> {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Map of sessionId -> { server, transport }
  const sessions = new Map<
    string,
    { transport: SSEServerTransport }
  >();

  // SSE endpoint — client GETs this to establish SSE connection
  app.get("/sse", async (_req, res) => {
    const transport = new SSEServerTransport("/messages", res);
    const server = createMcpServer();

    sessions.set(transport.sessionId, { transport });

    res.on("close", () => {
      sessions.delete(transport.sessionId);
    });

    await server.connect(transport);
  });

  // Messages endpoint — client POSTs JSON-RPC messages here
  app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId as string;
    const session = sessions.get(sessionId);
    if (!session) {
      res.status(400).json({ error: "Invalid session" });
      return;
    }
    await session.transport.handlePostMessage(req, res, req.body);
  });

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", sessions: sessions.size });
  });

  app.listen(PORT, () => {
    process.stderr.write(
      `[kwala-mcp] SSE transport listening on http://localhost:${PORT}/sse\n`
    );
  });
}

main().catch((error: unknown) => {
  process.stderr.write(
    `[kwala-mcp] fatal: ${error instanceof Error ? error.stack ?? error.message : String(error)}\n`
  );
  process.exit(1);
});

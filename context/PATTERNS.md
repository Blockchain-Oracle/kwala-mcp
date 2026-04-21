# MCP Server Patterns — Learned from xlmtools & pacifica-mcp

## Architecture Pattern (Proven, Reuse Exactly)

**Monorepo (pnpm workspaces):**
```
project/
├── packages/
│   ├── cli/    → @scope/cli   (core library, all tools, server factory, CLI)
│   ├── mcp/    → @scope/mcp   (thin stdio wrapper, ~30 lines)
│   ├── web/    → Landing page (Next.js)
│   ├── docs/   → Documentation (Nextra)
│   └── skills/ → SKILL.md for agent integration
├── package.json (root workspace)
├── pnpm-workspace.yaml
└── CLAUDE.md
```

**Why two packages:** `npx @scope/mcp` only works if the package has a single bin. Splitting cli (multi-bin) from mcp (single-bin) solves npm/npx resolution.

## MCP Server Factory Pattern

```typescript
// packages/cli/src/server.ts
export function createMcpServer(): McpServer {
  loadOrCreateWallet();
  const server = new McpServer(
    { name: "project-name", version: "0.1.0" },
    { capabilities: { tools: {}, logging: {} } },
  );
  registerToolA(server);
  registerToolB(server);
  // ... all tools
  return server;
}
```

```typescript
// packages/mcp/src/index.ts (~30 lines)
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "@scope/cli";

async function main(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
main().catch((e) => { process.stderr.write(`fatal: ${e.message}\n`); process.exit(1); });
```

## Tool Registration Pattern

```typescript
export function registerXxxTool(server: McpServer): void {
  server.registerTool(
    "tool-name",
    {
      title: "Human Title",
      description: "What it does. Multi-line OK.",
      inputSchema: z.object({
        param: z.string().describe("Description"),
        optional: z.number().optional().describe("Optional param"),
      }),
    },
    async (params) => {
      logger.debug(params, "tool-name invoked");
      try {
        // Logic
        return ok(data);
      } catch (e) {
        logger.error({ err: e }, "tool-name error");
        return err(String(e));
      }
    },
  );
}
```

## Response Format

```typescript
// lib/format.ts
export function ok(data: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    isError: false,
  };
}

export function err(message: string): CallToolResult {
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
  };
}
```

## Caching Pattern

```typescript
// lib/cache.ts — 5-minute TTL, key = toolName + JSON(params)
const TTL_MS = 5 * 60 * 1000;
const store = new Map<string, { result: CallToolResult; expires: number }>();

export async function withCache(
  toolName: string,
  params: Record<string, unknown>,
  fn: () => Promise<CallToolResult>,
): Promise<CallToolResult> {
  const key = `${toolName}:${JSON.stringify(params)}`;
  const cached = store.get(key);
  if (cached && Date.now() < cached.expires) return cached.result; // prefix with [cached]
  const result = await fn();
  if (!result.isError) store.set(key, { result, expires: Date.now() + TTL_MS });
  if (store.size > 50) { /* evict expired */ }
  return result;
}

export function invalidateCache(...prefixes: string[]): void { /* clear matching */ }
export function invalidateCacheAll(): void { store.clear(); }
```

## Wallet Pattern

```typescript
// lib/wallet.ts — ~/.project/config.json
const CONFIG_PATH = join(homedir(), ".project/config.json");

export function loadOrCreateWallet(): Config {
  if (existsSync(CONFIG_PATH)) return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  const wallet = generateNewWallet();
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(wallet, null, 2), { mode: 0o600 });
  return wallet;
}
```

## Logger Pattern

```typescript
// lib/logger.ts — pino to stderr (keeps MCP stdio clean)
import pino from "pino";
export const logger = pino(
  { name: "project-name", level: process.env.LOG_LEVEL ?? "info" },
  pino.destination(2), // stderr
);
```

## API Client Pattern

```typescript
// lib/api.ts — single base URL, get/post helpers
const BASE_URL = "https://api.example.com";

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, BASE_URL);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(new URL(path, BASE_URL).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as T;
}
```

## Build Configuration

```json
// tsconfig.json (both packages identical)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src"]
}
```

```json
// package.json (cli)
{ "type": "module", "main": "./dist/server.js", "types": "./dist/server.d.ts", "bin": { "cli-name": "dist/cli.js" } }

// package.json (mcp)
{ "type": "module", "bin": { "mcp-name": "dist/index.js" } }
```

## Key Dependencies (Proven Stack)

| Package | Version | Purpose |
|---------|---------|---------|
| @modelcontextprotocol/sdk | ^1.29.0 | MCP protocol |
| zod | 4.3.6 (pinned) | Schema validation |
| pino | ^10.3.1 | Logging (stderr) |
| commander | ^14.0.3 | CLI args |
| typescript | ^6.0.2 | Build |
| tsx | ^4.21.0 | Dev mode |
| vitest | ^4.1.2 | Testing |

## Read-Only Tool (with cache)
```typescript
return withCache("tool-name", params, async () => {
  try {
    const data = await apiGet("/endpoint", { key: params.key });
    return ok(data);
  } catch (e) {
    return err(String(e));
  }
});
```

## Write Tool (with cache invalidation)
```typescript
try {
  const result = await apiPost("/endpoint", body);
  invalidateCacheAll(); // or invalidateCache("related-tool")
  return ok(result);
} catch (e) {
  return err(String(e));
}
```

## CLI Pattern

Commander subcommands with 1:1 parity to MCP tools. Same logic, different entry point.
CLI can also start MCP server when no subcommand given (dual-mode).

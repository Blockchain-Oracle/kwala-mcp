# kwala-mcp

## What this is
MCP server for Kwala Network blockchain automation. 19 tools for AI agents to create, verify, deploy, and monitor Kwalang YAML workflows via natural language.

Install: `claude mcp add kwala npx @kwala-dev/mcp`

## Project structure
- `packages/cli` — @kwala-dev/cli: core library, 19 tools, server factory, CLI
- `packages/mcp` — @kwala-dev/mcp: thin stdio wrapper (~30 lines)
- `packages/web` — Web app (Next.js): landing page, explorer, chat with generative UI
- `packages/docs` — Documentation site (Nextra) — maintained by teammates
- `packages/skills` — SKILL.md for agent integration
- `workflows/` — 6 example Kwalang YAML files
- `context/` — Reference repos and patterns (not published)
- `docs/` — Full spec and design docs (not published)

## Tools (19 total)
**Workflow Generation (5):** create-automation, explain-yaml, list-templates, build-trigger, build-action
**Deployment (4):** verify-workflow, deploy-workflow, workflow-status, list-workflows
**Explorer (4):** explorer-stats, explorer-actions, get-workflow, fetch-abi
**Account (4):** wallet, credit-balance, configure, login
**System (2):** list-chains, tools

## Key rules
1. Use `pino` logger, NEVER console.log/error — `import { logger } from "./lib/logger.js"`
2. All tools: `registerXxxTool(server: McpServer)` pattern, one file per tool
3. Responses: `ok(data)` / `err(message)` from `lib/format.ts`
4. Read-only tools use `withCache()` (5-min TTL)
5. Write tools call `invalidateCacheAll()` after mutation
6. Tools auto-populate wallet address from stored config — never require it
7. Tools auto-fetch ABIs and base64-encode internally — never expose base64 to agent
8. Chain names resolved fuzzy ("Base" → 8453) via `resolveChainId()`
9. Token names resolved via `lib/tokens.ts` ("USDC" on "Base" → address)
10. Notification creds (Telegram/Discord) stored once via `kwala-configure`, auto-used by all tools
11. Unsupported chains/tokens return clear errors — never silently default
12. No placeholder values — hard error if required params missing

## Kwala constants
- KWALA chain ID: 1905
- RPC: `https://rpc-ohio.kwala.network`
- Contract: `0x3e0c606d0ce3f0dec6c569a586a59128a1d9613e`
- API base: `https://kwala-test.kalp.network` (most endpoints no auth)
- Auth: Google OAuth → JWT for `POST /auth/workflow/deploy`
- Wallet config: `~/.kwala-mcp/config.json` (wallet + notifications + auth)

## Tech stack
- Node.js 18+, TypeScript, ES modules, pnpm workspaces
- @modelcontextprotocol/sdk ^1.29.0, zod, pino, ethers ^6, yaml, commander

## Development
```bash
pnpm install
pnpm build          # Build all packages
pnpm dev:mcp        # Dev mode with tsx watch
pnpm dev:cli        # CLI dev mode
```

## Deployment flow (on-chain to KWALA 1905)
1. POST /workflow/verify (REST, no auth)
2. saveWorkflow(yaml) — raw signed tx to contract (no ethers provider, manual nonce)
3. deployWorkflow(yaml) — raw signed tx (Name mutated: name_0xaddress)
4. GET /workflow/chaincode/{id} — chaincode address (retries 3x)
5. POST /auth/workflow/deploy (JWT auth) — tells backend to start monitoring
6. Fallback: triggerWorkflow(chaincodeAddress) — on-chain activation (may 500)

## KWALA RPC quirks
- No batch JSON-RPC support (returns parse error)
- Non-standard block format (no parentHash, returns number not object)
- eth_sendRawTransaction returns object `{txHash, from, to, validation}` not just hash
- Nonces don't increment conventionally
- Must use raw RPC calls — ethers.js Provider/Contract classes fail

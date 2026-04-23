# Kwala MCP

MCP server that lets AI agents create, deploy, and monitor blockchain automations on [Kwala Network](https://kwala.network) using natural language. 20 tools. One-line install.

## Quick Start

```bash
# Claude Code
claude mcp add kwala npx @kwala-dev/mcp

# Cursor / Windsurf / Claude Desktop / VS Code / Zed / Cline / Goose
# Add to the client's MCP config:
#   { "command": "npx", "args": ["-y", "@kwala-dev/mcp"] }
```

### Standalone CLI

```bash
npm install -g @kwala-dev/cli
kwala --help
```

On first run, Kwala MCP generates a wallet on the KWALA chain (chain ID 1905). The private key is stored locally at `~/.kwala-mcp/config.json` and never leaves your machine.

## What This Does

Kwala MCP gives AI agents full access to the Kwala Network automation platform. Describe what you want in plain English -- "alert me on Telegram when USDC is transferred on Ethereum" -- and the agent generates a Kwalang YAML workflow, verifies it, deploys it on-chain, and monitors its execution. No Solidity. No manual config. Works across 11 EVM chains.

Works with every major agent client (Claude Code, Claude Desktop, Cursor, Windsurf, VS Code Copilot, Gemini CLI, Zed, Continue, Cline, Goose) and as a standalone `kwala` CLI for direct terminal use.

## Tools

### Workflow Generation

| Tool | What it does |
| --- | --- |
| `kwala-create-automation` | Generate a complete Kwalang YAML workflow from natural language |
| `kwala-explain-yaml` | Explain a workflow in plain English |
| `kwala-list-templates` | Browse pre-built workflow templates |
| `kwala-build-trigger` | Generate a trigger configuration |
| `kwala-build-action` | Generate an action configuration |

### Deployment

| Tool | What it does |
| --- | --- |
| `kwala-verify-workflow` | Verify YAML via Kwala's backend API |
| `kwala-deploy-workflow` | Deploy and activate a workflow on-chain |
| `kwala-deactivate-workflow` | Stop a running workflow by expiring it immediately |
| `kwala-workflow-status` | Check workflow deployment and execution status |
| `kwala-list-workflows` | List your deployed workflows |

### Explorer

| Tool | What it does |
| --- | --- |
| `kwala-explorer-stats` | Kwala network statistics |
| `kwala-explorer-actions` | Browse execution logs |
| `kwala-get-workflow` | Fetch a deployed workflow's YAML by ID |
| `kwala-fetch-abi` | Fetch a contract's ABI for any chain |

### Account

| Tool | What it does |
| --- | --- |
| `kwala-wallet` | Show/create your KWALA chain wallet |
| `kwala-credit-balance` | Check Kwala credit balance |
| `kwala-configure` | Store Telegram/Discord/webhook notification settings |
| `kwala-login` | Authenticate with Kwala via Google OAuth |

### System

| Tool | What it does |
| --- | --- |
| `kwala-list-chains` | List all supported chains |
| `kwala-tools` | List all available tools |

## Supported Chains

| Chain | Chain ID | Network | Symbol |
| --- | --- | --- | --- |
| Ethereum | 1 | Mainnet | ETH |
| BNB Chain | 56 | Mainnet | BNB |
| Polygon | 137 | Mainnet | MATIC |
| Avalanche C-Chain | 43114 | Mainnet | AVAX |
| Celo | 42220 | Mainnet | CELO |
| Base | 8453 | Mainnet | ETH |
| Sepolia | 11155111 | Testnet | ETH |
| Polygon Amoy | 80002 | Testnet | MATIC |
| Avalanche Fuji | 43113 | Testnet | AVAX |
| Base Sepolia | 84532 | Testnet | ETH |
| Kalp Chain | 1905 | Internal | GINI |

## Example Workflow

A Kwalang YAML workflow that sends a Telegram alert on every USDC transfer:

```yaml
Name: TokenTransferAlert
Trigger:
  TriggerSourceContract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  TriggerChainID: 1
  TriggerEventName: "Transfer(address,address,uint256)"
  TriggerEventFilter: "NA"
  RepeatEvery: "event"
  ExecuteAfter: "event"
Actions:
  - Name: SendTelegramAlert
    Type: post
    APIEndpoint: "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage"
    APIPayload:
      chat_id: "<YOUR_CHAT_ID>"
      text: "USDC Transfer: from re.event(0) to re.event(1), amount: re.event(2)"
    RetriesUntilSuccess: 3
Execution:
  Mode: sequential
```

More examples in the [`workflows/`](workflows/) directory: treasury monitoring, oracle price alerts, address tracking, auto top-up, and NFT reward minting.

## CLI Usage

```bash
# Show your wallet
kwala wallet

# List supported chains
kwala list-chains

# Browse workflow templates
kwala list-templates --category alerts

# Fetch a contract's ABI
kwala fetch-abi 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 --chain ethereum

# Verify a workflow YAML
kwala verify-workflow workflows/token-transfer-alert.yaml

# Deploy a workflow on-chain
kwala deploy-workflow workflows/token-transfer-alert.yaml

# Check workflow status
kwala workflow-status TokenTransferAlert

# List your deployed workflows
kwala list-workflows

# Check Kwala credit balance
kwala credit-balance

# View network stats
kwala explorer-stats

# List all tools
kwala tools
```

## Architecture

```
packages/
  mcp/     @kwala-dev/mcp   — Thin MCP stdio wrapper (imports from cli)
  cli/     @kwala-dev/cli   — 20 tools, API client, wallet, deployer, CLI
  web/     Landing page     — Next.js frontend
  docs/    Documentation    — Nextra docs site
  skills/  Agent Skill      — SKILL.md for cross-client install
```

The MCP package is a thin wrapper. All tool logic lives in `@kwala-dev/cli`, which exports a `createMcpServer()` factory. This split ensures `npx @kwala-dev/mcp` works cleanly across all MCP hosts.

**Workflow lifecycle:**

```
Natural language prompt
  → kwala-create-automation generates Kwalang YAML
  → kwala-verify-workflow validates via Kwala backend
  → kwala-deploy-workflow deploys to KWALA chain (chain ID 1905)
  → kwala-workflow-status monitors execution
  → Kwala Network watches the target chain for trigger events
  → Actions fire automatically (webhooks, contract calls, notifications)
```

## Web UI (Generative AI Chat)

The project includes a web interface with an AI-powered chat that calls kwala tools and renders results as interactive card components.

### Setup and Run

```bash
pnpm install
pnpm build

# Set one of these:
export OPENAI_API_KEY=sk-...
# or
export ANTHROPIC_API_KEY=sk-ant-...

# Run the web app:
pnpm dev

# Visit http://localhost:3000       (landing page)
# Visit http://localhost:3000/chat  (AI chat with generative UI)
```

The chat calls kwala tools directly and renders results as cards (deployment progress, wallet info, workflow status, chain selectors, YAML previews, etc).

### Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | One of these | Anthropic API key for Claude |
| `OPENAI_API_KEY` | One of these | OpenAI API key for GPT-4o |
| `ANTHROPIC_MODEL` | No | Model name (default: `claude-sonnet-4-20250514`) |
| `OPENAI_MODEL` | No | Model name (default: `gpt-4o`) |

## First-Time Setup

On first run, a wallet is auto-generated at `~/.kwala-mcp/config.json`. To set up notifications:

```bash
# Configure Telegram (one-time)
kwala configure --telegram-token YOUR_BOT_TOKEN --telegram-chat YOUR_CHAT_ID

# Configure Discord (one-time)
kwala configure --discord-webhook https://discord.com/api/webhooks/...

# Set default chain
kwala configure --default-chain Base
```

After configuring, all workflows auto-use your stored notification settings. No need to pass tokens every time.

To get a Telegram bot token: message @BotFather on Telegram, create a bot, copy the token. Then send your bot a message and call `https://api.telegram.org/bot<TOKEN>/getUpdates` to find your chat ID.

## Development

```bash
pnpm install
pnpm build       # Build all packages
pnpm dev         # Run web app
```

Individual packages:

```bash
pnpm dev:mcp     # MCP stdio server with tsx watch
pnpm dev:cli     # CLI with tsx watch
pnpm dev:web     # Web app (port 3000)
```

## Tech Stack

- TypeScript, Node.js 18+, ES modules, pnpm workspaces
- @modelcontextprotocol/sdk (MCP protocol)
- ethers.js (ABI encoding, raw transaction signing)
- Commander (CLI), Zod 4 (validation), pino (logging)
- Next.js 16, Tailwind CSS, Vercel AI SDK (web UI)
- SQLite + Drizzle ORM (chat history)
- YAML (Kwalang workflow format)
- Kwala Network API + KWALA chain (chain ID 1905)

## License

MIT

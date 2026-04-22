---
name: kwala
description: Kwala Network MCP — create, verify, deploy, and monitor blockchain automations via natural language. 17 tools for Kwalang YAML workflows across 6 EVM chains.
---

# Kwala MCP Skill

## When to use

Activate this skill when the user asks about:
- Blockchain automation, workflow creation, or Kwalang YAML
- Deploying, monitoring, or managing automations on Kwala Network
- Watching smart contract events, token transfers, price alerts
- Sending notifications (Telegram, Discord, webhook) based on on-chain events
- Checking Kwala network stats, execution logs, or credit balance
- Fetching contract ABIs on any EVM chain
- Any mention of "Kwala", "Kwalang", or "workflow automation"

## When NOT to use

- General blockchain knowledge questions (answer from training data)
- Non-Kwala smart contract development
- Questions about other automation platforms (Chainlink Automation, Gelato, etc.)
- Math, coding help, or anything answerable without tools

## Install

**MCP (recommended):**
```bash
claude mcp add kwala npx @kwala-dev/mcp
```

**CLI:**
```bash
npm install -g @kwala-dev/cli
kwala --help
```

**First run:** A wallet is auto-generated at `~/.kwala-mcp/config.json`. No API keys needed.

## Mode priority

1. **MCP tools** (`kwala-*`) — preferred, cached responses, structured output
2. **CLI** (`kwala <command>`) — fallback, always works, JSON to stdout

## Tool catalog (17 tools)

### Workflow Generation (5 tools)

| Tool | Description | Key params |
|------|-------------|------------|
| `kwala-create-automation` | Generate a complete Kwalang YAML workflow | `name`, `trigger_type`, `actions[]`, `chain?`, `contract_address?` |
| `kwala-explain-yaml` | Explain a workflow in plain English | `yaml` or `workflow_id` |
| `kwala-list-templates` | Browse 6 pre-built templates | `category?`, `search?` |
| `kwala-build-trigger` | Generate a trigger YAML section | `type`, `contract_address?`, `chain?`, `event_name?` |
| `kwala-build-action` | Generate an action YAML block | `type` (call/notification/api/deploy), `name`, channel-specific params |

### Deployment (4 tools)

| Tool | Description | Key params |
|------|-------------|------------|
| `kwala-verify-workflow` | Verify YAML against Kwala's backend API | `yaml` |
| `kwala-deploy-workflow` | Deploy end-to-end on KWALA chain (save → deploy → activate) | `yaml`, `auto_activate?` |
| `kwala-workflow-status` | Check workflow status | `workflow_id` (accepts name or full ID) |
| `kwala-list-workflows` | List deployed workflows | `address?`, `page?` |

### Explorer (4 tools)

| Tool | Description | Key params |
|------|-------------|------------|
| `kwala-explorer-stats` | Network-wide statistics | `user_address?`, `workflow_name?` |
| `kwala-explorer-actions` | Browse execution logs | `page?`, `page_size?`, `user_address?` |
| `kwala-get-workflow` | Fetch deployed workflow YAML | `workflow_id` (accepts name or full ID) |
| `kwala-fetch-abi` | Fetch contract ABI + list events/functions | `address`, `chain` (name or ID) |

### Account (2 tools)

| Tool | Description | Key params |
|------|-------------|------------|
| `kwala-wallet` | Show/create KWALA chain wallet | (none) |
| `kwala-credit-balance` | Check Kwala credit balance | `address?` |

### System (2 tools)

| Tool | Description | Key params |
|------|-------------|------------|
| `kwala-list-chains` | List supported chains + tokens | `network?` (mainnet/testnet/all) |
| `kwala-tools` | List all 17 tools | (none) |

## Decision tree

| User wants to... | Tool to use | Notes |
|---|---|---|
| Create an automation from description | `kwala-create-automation` | Auto-resolves tokens, chains, ABIs |
| Understand a YAML workflow | `kwala-explain-yaml` | Accepts YAML or workflow ID |
| See available templates | `kwala-list-templates` | Filter by category or search |
| Build a trigger step by step | `kwala-build-trigger` | All 6 trigger types supported |
| Build an action step by step | `kwala-build-action` | Supports notification shortcuts |
| Check if YAML is valid | `kwala-verify-workflow` | Local + API validation |
| Deploy a workflow | `kwala-deploy-workflow` | Full on-chain pipeline |
| Check deployment status | `kwala-workflow-status` | Accepts name or full ID |
| See all deployed workflows | `kwala-list-workflows` | Defaults to stored wallet |
| Check network activity | `kwala-explorer-stats` | Total actions + workflows |
| See execution logs | `kwala-explorer-actions` | Paginated |
| Fetch a deployed YAML | `kwala-get-workflow` | Accepts name or full ID |
| Get a contract's ABI | `kwala-fetch-abi` | Returns events + functions list |
| See wallet address | `kwala-wallet` | Auto-creates on first use |
| Check credit balance | `kwala-credit-balance` | Defaults to stored wallet |
| See supported chains | `kwala-list-chains` | Includes token addresses |

## UX rules (non-negotiable)

1. **Never ask the user for base64-encoded ABIs.** Tools auto-fetch and encode ABIs internally.
2. **Resolve token names automatically.** "USDC on Base" → the tool handles the address lookup.
3. **Resolve chain names fuzzy.** Accept "Base", "base", "base sepolia", "8453" — all work.
4. **Default to testnet.** Unless the user explicitly says mainnet, use testnet chain IDs.
5. **Default to stored wallet.** Never ask for wallet address unless the user wants a different one.
6. **Show next steps.** After `create-automation`, suggest `verify-workflow` → `deploy-workflow`.
7. **Report deployment progress.** `deploy-workflow` returns step-by-step results — show each step.
8. **On errors, show the suggestion field.** Every error response includes a `suggestion` for recovery.

## Typical workflow

```
User: "Notify me on Telegram when USDC is transferred on Base"

1. kwala-create-automation
   → name: "USDCAlert"
   → trigger_type: "event"
   → contract_address: "USDC"  (auto-resolves to 0x833...)
   → chain: "Base"             (auto-resolves to testnet 84532)
   → event_name: "Transfer"    (auto-resolves to full signature)
   → actions: [{ type: "notification", channel: "telegram", bot_token, chat_id, message }]
   → Returns: complete YAML

2. kwala-verify-workflow
   → yaml: (the generated YAML)
   → Returns: { verified: true, ready_to_deploy: true }

3. kwala-deploy-workflow
   → yaml: (the verified YAML)
   → Returns: { deployed: true, steps: [...], workflow_id, chaincode_address }

4. kwala-workflow-status
   → workflow_id: "USDCAlert"
   → Returns: status + execution history
```

## Supported trigger types

| Type | What it watches | Key params |
|------|-----------------|------------|
| `event` | Smart contract event | `contract_address`, `event_name`, `chain` |
| `time` | Fixed interval | `interval_seconds` |
| `cron` | Cron schedule | `cron_expression` |
| `oracle_price` | Token price threshold | `price` |
| `block` | Block number | `block_number` |
| `address_tracking` | Any address activity | `contract_address`, `chain` |

## Supported action types

| Type | What it does | Key params |
|------|-------------|------------|
| `call` | Smart contract function call | `contract_address`, `function_name`, `params`, `chain` |
| `notification` | Telegram/Discord/webhook | `channel`, `bot_token`/`webhook_url`, `message` |
| `api` | Raw REST API POST | `api_endpoint`, `api_payload` |
| `deploy` | Deploy a new smart contract | `bytecode`, `constructor_args`, `chain` |

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| "No ABI found" | Contract not verified | Provide `abi_json` manually in build-trigger/build-action |
| "Insufficient funds" | Wallet needs KWALA gas | Fund wallet on KWALA chain (1905) |
| "Verification failed" | Invalid YAML structure | Check the `errors` array in the response |
| "Chaincode not found" | Deploy still propagating | Wait 10s, call `workflow-status` again |
| "Unknown chain" | Unrecognized chain name | Use `list-chains` to see valid names/IDs |

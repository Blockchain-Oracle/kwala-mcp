# Kwala MCP — Full Design Specification

**Project:** kwala-mcp
**Hackathon:** Kwala Network x Schulltech (April 23-24, 2026, 48 hours)
**Judging:** 33% Kwala Usage Depth, 33% Functionality, 33% Business Viability
**Submission:** GitHub repo + 3-5 min demo video + 1-pager via DoraHacks

---

## 1. What We're Building

An MCP (Model Context Protocol) server that gives AI agents **end-to-end** ability to create, verify, deploy, activate, and monitor Kwala Network blockchain automations through natural language. No dashboard needed.

**One-line install:**
```
claude mcp add kwala npx @kwala-dev/mcp
```

**The pitch:** You say "notify me on Telegram when USDC is deposited to my treasury wallet on Base" — and the agent generates valid Kwalang YAML, verifies it against Kwala's backend, deploys it on-chain, and activates it. Fully programmatic. Works for developers AND non-technical users.

---

## 2. What Kwala Network Is

Kwala is a **serverless Web3 backend automation platform**. Developers write declarative YAML workflows ("Kwalang") that react to blockchain events and execute on-chain/off-chain actions. Workflows run on distributed Kwala nodes using the Kwala Virtual Machine (KVM).

**Key properties:**
- YAML-based, no backend code needed
- Supports 6 EVM chains + testnets
- ERC-4337 smart wallets (gasless, Kwala sponsors fees)
- Deployment via on-chain smart contract calls (KWALA chain 1905) — fully programmable
- Verify endpoint is a REST call (no auth required)
- Pay-as-you-go credits (~49 USDT = 20 credits on BNB Chain)
- Immutable once deployed (cannot edit after deployment)
- Max 10 actions per workflow

---

## 3. Discovered APIs & Packages

### 3.1 Kwala Explorer API (LIVE, NO AUTH REQUIRED)

**Base URL:** `https://kwala-test.kalp.network`

These are undocumented endpoints discovered by reverse-engineering the Kwala Explorer frontend.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/explorer/actions/count` | Total action execution count across all workflows |
| `GET` | `/explorer/actions/count?workflow_name={name}` | Action count for a specific workflow |
| `GET` | `/explorer/actions/count?user_address={addr}` | Action count for a specific user |
| `GET` | `/explorer/actions?page={n}&page_size={n}` | Paginated action execution log |
| `GET` | `/explorer/actions?user_address={addr}&page={n}&page_size={n}` | Action log filtered by user |
| `GET` | `/explorer/workflows/deployed/count` | Total deployed workflow count |
| `GET` | `/workflow/yaml/{workflowId}` | Fetch full YAML definition of a deployed workflow |

**Action log entry schema:**
```json
{
  "id": 1032250,
  "workflow_id": "workflow-7asztwP9ANRc",
  "action_id": "APICall",
  "execution_time": 0.757,
  "chain_id": 1905,
  "success": true,
  "workflow_starttime": 1776752905,
  "retries": 1,
  "next_run": 1776752966,
  "gas_fees": "1000000000000000",
  "error": "",
  "trace_id": "30160233-caf5-45e0-b16f-2eac6238d352",
  "created_at": "2026-04-21T06:28:26.513268Z",
  "updated_at": "2026-04-21T06:28:26.513268Z",
  "deleted_at": null
}
```

### 3.2 Kwala Deployment API (REVERSE-ENGINEERED FROM DASHBOARD)

Deployment is NOT dashboard-only. The dashboard calls a smart contract on the KWALA chain + REST endpoints. We can replicate this programmatically.

**KWALA Chain:**
- Chain ID: `1905` (hex: `0x771`)
- RPC: `https://rpc-ohio.kwala.network`
- Contract: `0x3e0c606d0ce3f0dec6c569a586a59128a1d9613e`

#### Step 1: Verify/Compile (REST call, no auth)
```
POST https://kwala-test.kalp.network/workflow/verify
Content-Type: application/json

{
  "yaml": "<kwalang YAML string>",
  "user_address": "<0x wallet address>"
}

Response: { "syntax_check": true, "schema_validation": true }
```

#### Step 2: Save (on-chain transaction)
```solidity
function saveWorkflow(string yaml)
```
ABI-encode the call, send tx to `0x3e0c606d0ce3f0dec6c569a586a59128a1d9613e` on KWALA chain.

#### Step 3: Deploy (on-chain transaction)
```solidity
function deployWorkflow(string calldata yaml)
```
Same contract. The YAML `Name` field is mutated: `Name: workflowName_0xwalletAddress`.

After the on-chain tx, the dashboard also calls:
```
POST https://kwala-test.kalp.network/auth/workflow/deploy
Authorization: Bearer <jwt_token>
```

#### Step 4: Activate (on-chain transaction)
First fetch the chaincode address:
```
GET https://kwala-test.kalp.network/workflow/chaincode/<workflowName_0xwalletAddress>
Response: { "chaincode_address": "a479e07652eb312069fbbabe58cd180fd14eca08" }
```
Then call:
```solidity
function triggerWorkflow(address chaincodeAddress)
```

#### Smart Contract Function Summary

| Function | Signature | Purpose |
|----------|-----------|---------|
| `saveWorkflow` | `saveWorkflow(string yaml)` | Save workflow to chain |
| `deployWorkflow` | `deployWorkflow(string calldata yaml)` | Deploy workflow |
| `triggerWorkflow` | `triggerWorkflow(address chaincodeAddress)` | Activate workflow |
| `updateExpiresIn` | `updateExpiresIn(address chaincodeAddress, uint256 expiresIn)` | Update expiration |

#### YAML Name Mutation

Before save/deploy, the Name field gets the wallet address appended:
```
Name: myworkflow  →  Name: myworkflow_0xAbC123...
```
The workflow ID used in all API lookups is this combined `name_address` string.

### 3.3 Kwala Backend API (FULL ENDPOINT LIST)

**Base URL:** `https://kwala-test.kalp.network`

All endpoints discovered by reverse-engineering the dashboard SPA bundle:

#### Workflow Endpoints (no auth for reads)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/workflow/verify` | Verify/compile YAML (no auth) |
| `GET` | `/workflow/deployer/{address}?page=N&page_size=N` | List workflows by deployer |
| `GET` | `/workflow/{workflowId}/status` | Workflow status |
| `GET` | `/workflow/chaincode/{workflowId}` | Get deployed chaincode address |
| `GET` | `/workflow/yaml/{workflowId}` | Get workflow YAML source |
| `GET` | `/workflow/actionLog/view/list/{address}?page=N&page_size=N&success=true` | Action logs for user |
| `GET` | `/workflow/actionLog/view/summary/{address}` | Action summary stats |
| `GET` | `/workflow/event-data/events?chaincodeAddress={addr}` | Events for a chaincode |
| `WS` | `/workflow/ws?enrollmentID={address}` | Real-time balance/notifications |

#### Explorer Endpoints (no auth)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/explorer/actions/count` | Total action execution count |
| `GET` | `/explorer/actions?page=N&page_size=N` | Paginated action log |
| `GET` | `/explorer/workflows/deployed/count` | Total deployed workflow count |

#### Contract/Chain Endpoints (no auth)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/contract/fetchABI?chain_id=N&chaincode_address={addr}` | Fetch contract ABI |
| `GET` | `/supported/tokensAndChains?tokensInfo=bool&mainnetChains=bool&testnetChains=bool` | Supported chains & tokens |
| `GET` | `/kwala-chains/deployer/{address}` | Chains used by a deployer |

#### User Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/user/getBalance/{walletId}` | KWALA credit balance |
| `GET` | `/smart-wallet/{address}` | Smart wallet info |

#### Auth Endpoints (JWT required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/auth/google/login` | OAuth redirect |
| `POST` | `/auth/refresh` | Refresh JWT token |
| `GET` | `/auth/profile` | Get user profile |
| `PUT` | `/auth/profile` | Update profile |
| `POST` | `/auth/recharge/{address}` | Recharge KWALA credits |
| `POST` | `/auth/workflow/deploy` | Notify backend of deploy tx |

#### Dashboard Configuration Constants (from JS bundle)

```javascript
{
  EXPECTED_CHAIN_ID: "0x771",
  TESTNET_CONTRACT_ADDRESS: "0x3e0c606d0ce3f0dec6c569a586a59128a1d9613e",
  DAPP_NAME: "KWALA",
  DAPP_ORIGIN: "https://kwala.network/",
  WORKFLOW_BASE_URL: "https://kwala-test.kalp.network",
  WORKFLOW_VERIFY_API: "https://kwala-test.kalp.network/workflow/verify",
  WORKFLOW_DEPLOYER_API: "https://kwala-test.kalp.network/workflow/deployer",
  WORKFLOW_STATUS_API: "https://kwala-test.kalp.network/workflow"
}
```

### 3.4 Kalp Studio Gateway API (Smart Contract Invocation)

**Base URL:** `https://gateway-api.kalp.studio`
**Auth:** `x-api-key` header (obtained from Kalp Studio console)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/contract/kalp/invoke/{contractId}/{functionName}` | Invoke any deployed smart contract function |

**Request body:**
```json
{
  "network": "TESTNET",
  "blockchain": "KALP",
  "walletAddress": "0x...",
  "args": { ... }
}
```

### 3.5 Kalp Wallet API (MPC Wallets)

**Base URL:** `https://wallet-api.kalp.studio`
**Auth:** `apikey` header or `Authorization: Bearer YOUR_API_KEY`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/wallet/create-mnemonics` | Generate seed phrase |
| `POST` | `/wallet/create-wallet` | Create wallet (self-custodial, MPC, or custodial) |
| `POST` | `/auth/email/send` | Send email OTP for MPC wallet |
| `POST` | `/auth/email/verify` | Verify email OTP |
| `POST` | `/auth/phone/send` | Send phone SMS OTP |
| `POST` | `/auth/phone/verify` | Verify phone OTP |
| `POST` | `/auth/google/verify` | Google OAuth for MPC |
| `POST` | `/auth/mpc/verify` | MPC wallet verification |
| `POST` | `/wallet/send-contract-deploy-request` | Deploy smart contract (multipart/form-data) |

**Relay endpoint:** `POST https://wallet-api.kalp.studio/relayer/relay` (gasless meta-transactions)

### 3.6 KS Pay API (Fiat/Crypto Payments)

| Environment | Base URL |
|-------------|----------|
| Sandbox | `https://pay-open-sandboxapi.kalp.studio` |
| Production | `https://pay-open-liveapi.kalp.studio` |

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/generate-token/{appId}` | Generate auth token |
| `POST` | `/auth/refresh-token` | Refresh token |
| `GET` | `/currencies` | List supported currencies |
| `GET` | `/{currencyId}/payment-methods` | Payment methods for a currency |
| `POST` | `/transaction/initiate` | Initiate payment |
| `POST` | `/transaction/process` | Process payment |
| `GET` | `/transaction/txnId/{txnId}` | Get transaction by ID |
| `GET` | `/transaction` | List all transactions |

**Auth:** Bearer token from `/auth/generate-token`. Transactions need `x-signature` header.

### 3.7 npm Packages We Can Use

| Package | Version | What It Does |
|---------|---------|--------------|
| `@kalp_studio/tresori-mpc-sdk` | 1.0.4 | MPC wallet SDK — email OTP auth, ERC-20 transfers, gasless meta-transactions, bulk transfers, EIP-712 signing, multi-chain |
| `ks-gateway-connector` | 1.0.3 | Kalp blockchain SDK — key management, user registration, transaction submission |
| `kalp-relayer-sdk` | 0.0.2 | Gasless meta-transactions via EIP-712 + ERC-2771 relay |
| `@kalphq/sdk` | 0.2.0 | Kalp agent framework (published April 20, 2026) — defineAgent, createStep, createTool |
| `@kalphq/cli` | 0.1.0 | CLI for deploying Kalp agents |

**MPC SDK key constants:**
- `DEFAULT_API_BASE_URL`: `https://wallet-api.kalp.studio`
- `DEFAULT_RELAY_API_URL`: `https://wallet-api.kalp.studio/relayer/relay`
- `DEFAULT_FEE_RECIPIENT`: `0x663046eAd467db63FFCB3974e187e6C8F60D639B`
- `DEFAULT_SPONSOR_ADDRESS`: `0xd22fb5ce742c5b293e34070d9f93a50590e7cc41`

---

## 4. Supported Chains

### Mainnets

| Network | Chain ID |
|---------|----------|
| Ethereum | 1 |
| BNB Chain | 56 |
| Polygon | 137 |
| Avalanche C-Chain | 43114 |
| Celo | 42220 |
| Base | 8453 |

### Testnets

| Network | Chain ID |
|---------|----------|
| Sepolia (Ethereum) | 11155111 |
| Polygon Amoy | 80002 |
| Avalanche Fuji | 43113 |
| Base Sepolia | 84532 |

### Internal

| Network | Chain ID |
|---------|----------|
| Kalp Chain | 1905 |

---

## 5. Complete Kwalang YAML Schema

This is the full schema for a Kwala workflow YAML file, with every field documented.

```yaml
# --- METADATA ---
Name: string                          # Workflow name (required)

# --- TRIGGER SECTION ---
Trigger:

  # Primary event source (what starts the workflow)
  TriggerSourceContract: "0x..."      # Contract address to watch
  TriggerChainID: 1                   # Chain ID of the source contract
  TriggerEventName: "Transfer(address,address,uint256)"  # Solidity event signature
  TriggerEventFilter: "NA"            # Filter expression or "NA" for no filter
                                      #   Exact match: re.event(2) == 1000
                                      #   Comparison: re.event(2) > 500
                                      #   Range: re.event(2) >= 100 && re.event(2) <= 1000
                                      #   Multiple values: re.event(0) in [addr1, addr2]
  TriggerSourceContractABI: "base64..." # Base64-encoded ABI of the source contract

  # Recurring event source (optional, for multi-trigger workflows)
  RecurringSourceContract: "0x..."    # Secondary contract to watch
  RecurringChainID: 1                 # Chain ID of recurring source
  RecurringEventName: "EventName(type1,type2)"  # Event signature
  RecurringEventFilter: "NA"          # Filter or "NA"
  RecurringSourceContractABI: "base64..."  # Base64-encoded ABI

  # Timing & scheduling
  ExecuteAfter: "event"               # When to first execute:
                                      #   "event" — immediately on event
                                      #   1735689600 — Unix timestamp (delayed start)
                                      #   "block:18000000" — after specific block number
                                      #   "oracle_price" — on oracle price condition
                                      #   "address_tracking" — on any address activity

  RepeatEvery: "event"                # How often to re-execute:
                                      #   "event" — every time the event fires
                                      #   60 — every 60 seconds (interval)
                                      #   3600 — every hour
                                      #   86400 — daily
                                      #   604800 — weekly
                                      #   "0 9 * * *" — cron expression (daily 9am)
                                      #   "0 */6 * * *" — every 6 hours
                                      #   "oracle_price" — on each oracle price match
                                      #   "address_tracking" — on each address activity

  ExpiresIn: 1735689600               # When to stop:
                                      #   Unix timestamp, or
                                      #   "2592000" — duration in seconds (30 days)

  # Oracle price triggers
  TriggerPrice: 195.0                 # Price threshold for initial trigger
  RecurringPrice: 195.0               # Price threshold for recurring checks

  # Metadata & notifications
  Meta: "string"                      # Arbitrary metadata string
  ActionStatusNotificationPOSTURL: "https://..."  # Webhook for execution status callbacks
  ActionStatusNotificationAPIKey: "string"        # API key sent with the webhook

# --- ACTIONS SECTION (max 10) ---
Actions:

  # Type: "call" — Invoke a smart contract function
  - Name: "TransferTokens"            # Action name (required)
    Type: "call"                       # Action type (required)
    TargetContract: "0x..."            # Contract to call
    TargetFunction: "function transfer(address to, uint256 amount)"  # Full function signature
    TargetParams:                      # Parameters (positional array)
      - "0xRecipientAddress"           # Can use re.event(N) for dynamic values
      - "1000000"                      # Static values also allowed
    ChainID: 8453                      # Target chain
    EncodedABI: "NA"                   # Pre-encoded ABI or "NA"
    Metadata: "NA"                     # Action metadata or "NA"
    RetriesUntilSuccess: 3             # Additional retry attempts (total = 1 + N)

  # Type: "post" / "api" — Call a Web2 REST API
  - Name: "NotifyTelegram"
    Type: "post"
    APIEndpoint: "https://api.telegram.org/bot<TOKEN>/sendMessage"
    APIPayload:
      chat_id: "968602918"
      text: "Transfer detected: {{re.event(0)}} sent {{re.event(2)}} tokens"
    RetriesUntilSuccess: 5

  # Type: "deploy" — Deploy a smart contract
  - Name: "DeployRewardNFT"
    Type: "deploy"
    Bytecode: "0x6080..."              # Contract bytecode
    EncodedABI: "0x..."                # Constructor ABI encoding
    InitializationArgs:                # Constructor arguments
      - "MyNFT"
      - "NFT"
      - "1000"
    ChainID: 80002
    RetriesUntilSuccess: 3

# --- EXECUTION SECTION ---
Execution:
  Mode: "sequential"                   # "sequential" or "parallel"
```

### Dynamic Data: `re.event(N)` Syntax

When an event fires, its parameters are accessible via `re.event(0)`, `re.event(1)`, etc., mapping to the event signature's parameter positions.

**Example:** For `Transfer(address from, address to, uint256 amount)`:
- `re.event(0)` = `from` address
- `re.event(1)` = `to` address
- `re.event(2)` = `amount`

For **address tracking**, `re.event(0)` returns the full transaction receipt:
```
{
  from, to, contractAddress, transactionHash,
  chainId, blockNumber, status, logs[]
}
```

---

## 6. Trigger Type Reference

### 6.1 Event-Based (smart contract event)
```yaml
TriggerSourceContract: "0xContractAddress"
TriggerChainID: 8453
TriggerEventName: "Transfer(address,address,uint256)"
TriggerSourceContractABI: "base64encodedABI"
TriggerEventFilter: "NA"
ExecuteAfter: "event"
RepeatEvery: "event"
```

### 6.2 Time-Based (interval)
```yaml
ExecuteAfter: "event"        # or a Unix timestamp for delayed start
RepeatEvery: 3600            # seconds between executions
ExpiresIn: "2592000"         # stop after 30 days
```

### 6.3 Time-Based (cron)
```yaml
ExecuteAfter: "event"
RepeatEvery: "0 9 * * *"    # cron: daily at 9am UTC
ExpiresIn: 1735689600
```

### 6.4 Oracle Price
```yaml
TriggerPrice: 195.0
ExecuteAfter: "oracle_price"
RepeatEvery: "oracle_price"
```

### 6.5 Block Number
```yaml
ExecuteAfter: "block:18000000"
```

### 6.6 Address Tracking (broad — any activity on an address)
```yaml
TriggerSourceContract: "0xAddressToTrack"
TriggerChainID: 8453
ExecuteAfter: "address_tracking"
RepeatEvery: "address_tracking"
```

---

## 7. Project Architecture

```
kwala-mcp/
├── packages/
│   ├── cli/                          # @kwala-dev/cli — core library + all tools
│   │   ├── src/
│   │   │   ├── cli.ts                # Commander CLI entry point
│   │   │   ├── server.ts             # createMcpServer() factory
│   │   │   ├── tools/                # One file per MCP tool
│   │   │   │   ├── create-automation.ts   # Generate YAML from natural language
│   │   │   │   ├── verify-workflow.ts     # Verify YAML via Kwala REST API
│   │   │   │   ├── deploy-workflow.ts     # Deploy YAML on-chain (save + deploy + activate)
│   │   │   │   ├── workflow-status.ts     # Check deployment/execution status
│   │   │   │   ├── list-workflows.ts      # List user's deployed workflows
│   │   │   │   ├── explain-yaml.ts        # Explain a workflow in plain English
│   │   │   │   ├── list-templates.ts      # Browse pre-built templates
│   │   │   │   ├── build-trigger.ts       # Generate trigger YAML section
│   │   │   │   ├── build-action.ts        # Generate action YAML section
│   │   │   │   ├── list-chains.ts         # Supported chains registry
│   │   │   │   ├── explorer-stats.ts      # Kwala network stats
│   │   │   │   ├── explorer-actions.ts    # Browse execution logs
│   │   │   │   ├── get-workflow.ts        # Fetch deployed workflow YAML
│   │   │   │   ├── fetch-abi.ts           # Fetch contract ABI by address
│   │   │   │   ├── credit-balance.ts      # Check Kwala credit balance
│   │   │   │   ├── wallet.ts             # Show/create wallet for KWALA chain
│   │   │   │   └── tools-list.ts          # List all tools
│   │   │   └── lib/                  # Shared utilities
│   │   │       ├── logger.ts         # pino logger -> stderr
│   │   │       ├── format.ts         # ok(data) / err(message) helpers
│   │   │       ├── cache.ts          # 5-min TTL response cache
│   │   │       ├── api.ts            # HTTP client for kwala-test.kalp.network
│   │   │       ├── deployer.ts       # On-chain deployment (ethers.js -> KWALA chain)
│   │   │       ├── schema.ts         # Kwalang YAML Zod schema + validator
│   │   │       ├── templates.ts      # Built-in workflow templates
│   │   │       ├── chains.ts         # Chain registry (IDs, names, RPCs)
│   │   │       └── types.ts          # TypeScript type definitions
│   │   ├── package.json              # @kwala-dev/cli
│   │   └── tsconfig.json
│   │
│   ├── mcp/                          # @kwala-dev/mcp — thin stdio wrapper
│   │   ├── src/
│   │   │   └── index.ts              # ~30 lines: import createMcpServer, connect stdio
│   │   ├── package.json              # @kwala-dev/mcp, depends on @kwala-dev/cli
│   │   └── tsconfig.json
│   │
│   └── skills/                       # SKILL.md for Claude Code skill integration
│       └── SKILL.md
│
├── workflows/                        # Example Kwalang YAML files
│   ├── token-transfer-alert.yaml
│   ├── treasury-deposit-notifier.yaml
│   ├── oracle-price-alert.yaml
│   ├── address-tracker.yaml
│   ├── auto-topup-wallet.yaml
│   └── nft-reward-mint.yaml
│
├── package.json                      # Root workspace config
├── pnpm-workspace.yaml               # packages/*
├── tsconfig.json                     # Base TypeScript config
├── CLAUDE.md                         # Project instructions for Claude Code
├── SPEC.md                           # This file
├── LICENSE                           # MIT
└── README.md
```

### Package Relationships

```
@kwala-dev/mcp (thin wrapper, published to npm)
  └── depends on @kwala-dev/cli (core library, published to npm)
        └── depends on:
              @modelcontextprotocol/sdk   (MCP protocol)
              zod                         (schema validation)
              yaml                        (YAML parse/stringify)
              pino                        (logging)
              commander                   (CLI)
              ethers                      (on-chain deployment to KWALA chain)
```

### How It Works (End-to-End Flow)

1. User runs `claude mcp add kwala npx @kwala-dev/mcp`
2. `@kwala-dev/mcp` spawns, imports `createMcpServer()` from `@kwala-dev/cli`
3. `createMcpServer()` creates an `McpServer`, registers all 17 tools, returns it
4. MCP host (Claude, Cursor, etc.) discovers tools and can call them
5. User says: "Create and deploy a workflow that monitors USDC deposits on Base and sends a Telegram alert"
6. Agent calls `kwala-create-automation` -> generates Kwalang YAML
7. Agent calls `kwala-verify-workflow` -> POST to `/workflow/verify` -> confirms valid
8. Agent calls `kwala-deploy-workflow` -> sends on-chain tx to KWALA chain (save -> deploy -> activate)
9. Agent calls `kwala-workflow-status` -> confirms workflow is live
10. Done. No dashboard. No copy-paste. User never touches YAML.

---

## 8. MCP Tools — Complete Specification

### 8.1 `kwala-create-automation` — Generate a Kwalang YAML workflow

**Purpose:** The flagship tool. Takes a natural language description and generates a complete, valid, deployable Kwalang YAML workflow.

**Input schema:**
```typescript
{
  description: z.string()
    .describe("Natural language description of the automation"),
  chain: z.string().optional()
    .describe("Target chain name or ID. Defaults to Base Sepolia (84532)"),
  trigger_type: z.enum(["event", "time", "cron", "oracle_price", "block", "address_tracking"]).optional()
    .describe("Override the trigger type. If omitted, inferred from description"),
  execution_mode: z.enum(["sequential", "parallel"]).optional()
    .describe("Action execution mode. Default: sequential"),
  testnet: z.boolean().optional()
    .describe("If true, use testnet chain IDs. Default: true")
}
```

**Output:** Complete YAML workflow string + explanation of each section.

### 8.2 `kwala-verify-workflow` — Verify YAML via Kwala's backend

**Input:** `{ yaml: string, user_address?: string }`
**How:** `POST /workflow/verify` — no auth required.

### 8.3 `kwala-deploy-workflow` — Deploy end-to-end (on-chain)

**Input:** `{ yaml: string, auto_verify?: boolean, auto_activate?: boolean }`
**Flow:** verify -> mutate name -> saveWorkflow tx -> deployWorkflow tx -> get chaincode -> triggerWorkflow tx

### 8.4 `kwala-workflow-status` — Check status

**Input:** `{ workflow_id: string }`
**How:** `GET /workflow/{id}/status` + action summary

### 8.5 `kwala-list-workflows` — List deployed workflows

**Input:** `{ address?: string, page?: number, page_size?: number }`
**How:** `GET /workflow/deployer/{address}`

### 8.6 `kwala-explain-yaml` — Plain English explanation

**Input:** `{ yaml: string }`

### 8.7 `kwala-list-templates` — Browse templates

**Input:** `{ category?: "alerts" | "defi" | "nft" | "monitoring" | "notifications" | "all" }`
**Built-in templates (6):** Token Transfer Alert, Treasury Deposit Notifier, Oracle Price Alert, Address Tracker, Auto Top-Up Wallet, NFT Reward Mint

### 8.8 `kwala-build-trigger` — Generate trigger YAML section

**Input:** type + relevant fields (contract, chain, event, interval, cron, price, block, etc.)

### 8.9 `kwala-build-action` — Generate action YAML section

**Input:** type (call/post/deploy) + relevant fields

### 8.10 `kwala-list-chains` — Supported chains

**Input:** `{ network?: "mainnet" | "testnet" | "all" }`

### 8.11 `kwala-explorer-stats` — Network statistics

**Input:** `{ user_address?: string, workflow_name?: string }`

### 8.12 `kwala-explorer-actions` — Execution logs

**Input:** `{ page?: number, page_size?: number, user_address?: string }`

### 8.13 `kwala-get-workflow` — Fetch deployed workflow YAML

**Input:** `{ workflow_id: string }`

### 8.14 `kwala-fetch-abi` — Fetch contract ABI

**Input:** `{ address: string, chain_id: number }`

### 8.15 `kwala-credit-balance` — Check credits

**Input:** `{ address?: string }`

### 8.16 `kwala-wallet` — Show/create wallet

**Input:** none. Reads/creates `~/.kwala-mcp/config.json`.

### 8.17 `kwala-tools` — List all tools

**Input:** none.

---

## 9. Internal Lib Modules

### 9.1 `lib/format.ts`
- `ok(data)` -> `{ content: [{ type: "text", text: JSON.stringify(data) }], isError: false }`
- `err(msg)` -> `{ content: [{ type: "text", text: "Error: " + msg }], isError: true }`

### 9.2 `lib/logger.ts`
- pino logger writing to stderr (fd 2), so MCP stdio isn't polluted
- Name: "kwala-mcp", level from LOG_LEVEL env var or "info"

### 9.3 `lib/cache.ts`
- 5-minute TTL in-memory cache
- `withCache(toolName, params, fn)` -> returns cached or calls fn
- `invalidateCache(...prefixes)` -> clears matching entries

### 9.4 `lib/api.ts`
- HTTP client: `KWALA_API = "https://kwala-test.kalp.network"`
- `kwalaGet(path, params?)` / `kwalaPost(path, body?)`

### 9.5 `lib/deployer.ts`
- On-chain deployment to KWALA chain (1905) via ethers.js
- `CONTRACT = "0x3e0c606d0ce3f0dec6c569a586a59128a1d9613e"`
- Functions: saveWorkflow, deployWorkflow, triggerWorkflow, mutateYamlName

### 9.6 `lib/wallet.ts`
- Config path: `~/.kwala-mcp/config.json`
- `loadOrCreateWallet()` / `getWallet()`

### 9.7 `lib/schema.ts`
- Zod schema for Kwalang YAML
- `validateWorkflow(yamlString)` -> `{ valid, errors?, warnings?, parsed? }`

### 9.8 `lib/templates.ts`
- Array of WorkflowTemplate objects with id, name, category, yaml, etc.

### 9.9 `lib/chains.ts`
- `CHAINS` registry, `getChain()`, `getTestnetFor()`, `isSupported()`

### 9.10 `lib/types.ts`
- TypeScript interfaces for all data structures

---

## 10. Example Workflows

### 10.1 token-transfer-alert.yaml
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

### 10.2 treasury-deposit-notifier.yaml
```yaml
Name: TreasuryDepositNotifier
Trigger:
  TriggerSourceContract: "0xYourTreasuryAddress"
  TriggerChainID: 8453
  ExecuteAfter: "address_tracking"
  RepeatEvery: "address_tracking"
Actions:
  - Name: NotifyDiscord
    Type: post
    APIEndpoint: "https://discord.com/api/webhooks/<YOUR_WEBHOOK>"
    APIPayload:
      content: "Treasury activity detected! Tx: re.event(0)"
    RetriesUntilSuccess: 5
  - Name: LogToBackend
    Type: post
    APIEndpoint: "https://your-api.com/webhook/treasury"
    APIPayload:
      receipt: "re.event(0)"
    RetriesUntilSuccess: 3
Execution:
  Mode: sequential
```

### 10.3 oracle-price-alert.yaml
```yaml
Name: SOLPriceDropAlert
Trigger:
  TriggerPrice: 150.0
  ExecuteAfter: "oracle_price"
  RepeatEvery: "oracle_price"
  ExpiresIn: "2592000"
Actions:
  - Name: AlertTelegram
    Type: post
    APIEndpoint: "https://api.telegram.org/bot<TOKEN>/sendMessage"
    APIPayload:
      chat_id: "<CHAT_ID>"
      text: "SOL has dropped below $150!"
    RetriesUntilSuccess: 3
Execution:
  Mode: sequential
```

### 10.4 address-tracker.yaml
```yaml
Name: WalletActivityTracker
Trigger:
  TriggerSourceContract: "0xWalletToTrack"
  TriggerChainID: 137
  ExecuteAfter: "address_tracking"
  RepeatEvery: "address_tracking"
  ExpiresIn: "604800"
Actions:
  - Name: ForwardToWebhook
    Type: post
    APIEndpoint: "https://your-api.com/webhook/activity"
    APIPayload:
      type: "address_activity"
      receipt: "re.event(0)"
    RetriesUntilSuccess: 5
Execution:
  Mode: sequential
```

### 10.5 auto-topup-wallet.yaml
```yaml
Name: AutoTopUpWallet
Trigger:
  TriggerSourceContract: "0xBalanceCheckerContract"
  TriggerChainID: 8453
  TriggerEventName: "LowBalance(address,uint256)"
  TriggerEventFilter: "NA"
  RepeatEvery: "event"
  ExecuteAfter: "event"
Actions:
  - Name: TransferUSDC
    Type: call
    TargetContract: "0xUSDCContractAddress"
    TargetFunction: "function transfer(address to, uint256 amount)"
    TargetParams:
      - "re.event(0)"
      - "1000000"
    ChainID: 8453
    EncodedABI: "NA"
    Metadata: "NA"
    RetriesUntilSuccess: 3
  - Name: NotifyOwner
    Type: post
    APIEndpoint: "https://api.telegram.org/bot<TOKEN>/sendMessage"
    APIPayload:
      chat_id: "<CHAT_ID>"
      text: "Auto top-up sent 1 USDC to re.event(0)"
    RetriesUntilSuccess: 3
Execution:
  Mode: sequential
```

### 10.6 nft-reward-mint.yaml
```yaml
Name: NFTRewardOnPurchase
Trigger:
  TriggerSourceContract: "0xShopContract"
  TriggerChainID: 80002
  TriggerEventName: "PurchaseCompleted(address buyer, uint256 amount)"
  TriggerEventFilter: "re.event(1) > 100"
  RepeatEvery: "event"
  ExecuteAfter: "event"
Actions:
  - Name: MintRewardNFT
    Type: call
    TargetContract: "0xRewardNFTContract"
    TargetFunction: "function mintReward(address to)"
    TargetParams:
      - "re.event(0)"
    ChainID: 80002
    EncodedABI: "NA"
    Metadata: "NA"
    RetriesUntilSuccess: 5
  - Name: NotifyBuyer
    Type: post
    APIEndpoint: "https://api.telegram.org/bot<TOKEN>/sendMessage"
    APIPayload:
      chat_id: "<CHAT_ID>"
      text: "Reward NFT minted for buyer re.event(0)!"
    RetriesUntilSuccess: 3
Execution:
  Mode: sequential
```

---

## 11. Hackathon Scoring Alignment

### Kwala Usage Depth (33%)
- End-to-end deployment: Verify -> save -> deploy -> activate — all on-chain
- create-automation: Generates YAML using ALL trigger types, ALL action types
- verify-workflow: Uses Kwala's actual backend verify endpoint
- deploy-workflow: Calls the real smart contract on KWALA chain 1905
- explorer integration: Uses live undocumented Kwala Explorer API
- fetch-abi: Fetches ABIs via Kwala's own endpoint
- 6 example workflows covering all trigger types

### Functionality (33%)
- 17 MCP tools with proper Zod schemas
- True end-to-end: Generate -> verify -> deploy -> monitor
- Works with any MCP host (Claude Code, Cursor, Windsurf, etc.)
- One-line install: `npx @kwala-dev/mcp`
- CLI mode available
- Response caching, structured error handling

### Business Viability (33%)
- Targets non-technical users AND developers
- "Tell your AI agent what to automate" -> deployed in seconds
- npm + MCP ecosystem distribution
- Revenue: premium templates, hosted deployment proxy, usage-based billing

---

## 12. Scope Boundaries (NOT building)

- No custom Kwala Functions (Go-based on-chain functions)
- No KS Pay integration
- No web frontend (focus is MCP server + CLI)
- No Kalp DLT chaincode interaction

---

## 13. Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `LOG_LEVEL` | No | `info` | pino log level |

No API keys needed for core functionality. Wallet stored at `~/.kwala-mcp/config.json`.

---

## 14. Development Plan

1. Scaffold monorepo — root package.json, pnpm-workspace.yaml, tsconfigs
2. Build lib/ modules — format, logger, cache, api, deployer, wallet, schema, chains, templates, types
3. Build tools — one file per tool, all 17
4. Wire server.ts — createMcpServer() registers all tools
5. Wire mcp/index.ts — thin stdio wrapper
6. Add example workflows — 6 YAML files
7. Build + test — pnpm build, verify tools register, test YAML generation + verify endpoint
8. Write README — installation, usage, tool list, demo instructions

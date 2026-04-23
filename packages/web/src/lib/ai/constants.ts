/** Kwala chain and contract constants */
export const KWALA_CHAIN_ID = 1905;
export const KWALA_RPC_URL = "https://rpc-ohio.kwala.network";
export const KWALA_CONTRACT_ADDRESS =
  "0x3e0c606d0ce3f0dec6c569a586a59128a1d9613e";
export const KWALA_GAS_PRICE = "1000000000"; // 1 gwei
export const KWALA_GAS_LIMIT = "500000";

/** Contract ABI fragments used for deployment */
export const CONTRACT_ABI = [
  "function saveWorkflow(string yaml)",
  "function deployWorkflow(string calldata yaml)",
  "function triggerWorkflow(address chaincodeAddress)",
  "function updateExpiresIn(address chaincodeAddress, uint256 expiresIn)",
];

// ── Chain registry ──────────────────────────────────────────────────────

export interface ChainInfo {
  id: number;
  name: string;
  network: "mainnet" | "testnet" | "internal";
  symbol: string;
  testnetOf?: number;
}

export const CHAINS: ChainInfo[] = [
  { id: 1, name: "Ethereum", network: "mainnet", symbol: "ETH" },
  { id: 56, name: "BNB Chain", network: "mainnet", symbol: "BNB" },
  { id: 137, name: "Polygon", network: "mainnet", symbol: "MATIC" },
  { id: 43114, name: "Avalanche C-Chain", network: "mainnet", symbol: "AVAX" },
  { id: 42220, name: "Celo", network: "mainnet", symbol: "CELO" },
  { id: 8453, name: "Base", network: "mainnet", symbol: "ETH" },
  { id: 11155111, name: "Sepolia", network: "testnet", symbol: "ETH", testnetOf: 1 },
  { id: 80002, name: "Polygon Amoy", network: "testnet", symbol: "MATIC", testnetOf: 137 },
  { id: 43113, name: "Avalanche Fuji", network: "testnet", symbol: "AVAX", testnetOf: 43114 },
  { id: 84532, name: "Base Sepolia", network: "testnet", symbol: "ETH", testnetOf: 8453 },
  { id: 1905, name: "Kalp Chain", network: "internal", symbol: "GINI" },
];

const BY_ID = new Map(CHAINS.map((c) => [c.id, c]));
const BY_NAME = new Map<string, ChainInfo>();
for (const c of CHAINS) BY_NAME.set(c.name.toLowerCase(), c);
BY_NAME.set("eth", CHAINS[0]);
BY_NAME.set("ethereum", CHAINS[0]);
BY_NAME.set("bnb", CHAINS[1]);
BY_NAME.set("bsc", CHAINS[1]);
BY_NAME.set("poly", CHAINS[2]);
BY_NAME.set("polygon", CHAINS[2]);
BY_NAME.set("avax", CHAINS[3]);
BY_NAME.set("avalanche", CHAINS[3]);
BY_NAME.set("celo", CHAINS[4]);
BY_NAME.set("base", CHAINS[5]);
BY_NAME.set("sepolia", CHAINS[6]);
BY_NAME.set("base sepolia", CHAINS[9]);
BY_NAME.set("base-sepolia", CHAINS[9]);
BY_NAME.set("base_sepolia", CHAINS[9]);
BY_NAME.set("polygon amoy", CHAINS[7]);
BY_NAME.set("polygon-amoy", CHAINS[7]);
BY_NAME.set("amoy", CHAINS[7]);
BY_NAME.set("fuji", CHAINS[8]);
BY_NAME.set("avalanche fuji", CHAINS[8]);
BY_NAME.set("kwala", CHAINS[10]);
BY_NAME.set("kalp", CHAINS[10]);

export function getChain(idOrName: string | number): ChainInfo | undefined {
  if (typeof idOrName === "number") return BY_ID.get(idOrName);
  const num = Number(idOrName);
  if (!Number.isNaN(num)) return BY_ID.get(num);
  return BY_NAME.get(idOrName.toLowerCase().trim());
}

export function getTestnetFor(mainnetId: number): ChainInfo | undefined {
  return CHAINS.find((c) => c.testnetOf === mainnetId);
}

export function resolveChainId(input: string, testnet = true): number | undefined {
  const chain = getChain(input);
  if (!chain) return undefined;
  if (testnet && chain.network === "mainnet") {
    const testnetChain = getTestnetFor(chain.id);
    return testnetChain?.id ?? chain.id;
  }
  return chain.id;
}

// ── Token registry ──────────────────────────────────────────────────────

export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  addresses: Record<number, string>;
}

export const TOKENS: TokenInfo[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    addresses: {
      1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      137: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      56: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
      43114: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
      42220: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
      84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    },
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    addresses: {
      1: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      56: "0x55d398326f99059fF775485246999027B3197955",
      137: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      43114: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
      8453: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
    },
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
    addresses: {
      1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      8453: "0x4200000000000000000000000000000000000006",
      137: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
      43114: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB",
      84532: "0x4200000000000000000000000000000000000006",
    },
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    decimals: 8,
    addresses: {
      1: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      137: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
      43114: "0x50b7545627a5162F82A992c33b87aDc75187B218",
    },
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    decimals: 18,
    addresses: {
      1: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      137: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
      8453: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    },
  },
];

const BY_SYMBOL = new Map<string, TokenInfo>();
for (const t of TOKENS) {
  BY_SYMBOL.set(t.symbol.toLowerCase(), t);
  BY_SYMBOL.set(t.name.toLowerCase(), t);
}

export function resolveToken(nameOrSymbol: string, chainId: number): string | undefined {
  const token = BY_SYMBOL.get(nameOrSymbol.toLowerCase().trim());
  if (!token) return undefined;
  return token.addresses[chainId];
}

export function getToken(nameOrSymbol: string): TokenInfo | undefined {
  return BY_SYMBOL.get(nameOrSymbol.toLowerCase().trim());
}

// ── ABI helpers ─────────────────────────────────────────────────────────

const ERC20_ABI = [
  { type: "event", name: "Transfer", inputs: [{ name: "from", type: "address", indexed: true }, { name: "to", type: "address", indexed: true }, { name: "value", type: "uint256", indexed: false }] },
  { type: "event", name: "Approval", inputs: [{ name: "owner", type: "address", indexed: true }, { name: "spender", type: "address", indexed: true }, { name: "value", type: "uint256", indexed: false }] },
  { type: "function", name: "transfer", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { type: "function", name: "transferFrom", inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { type: "function", name: "balanceOf", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "totalSupply", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "decimals", inputs: [], outputs: [{ name: "", type: "uint8" }] },
  { type: "function", name: "symbol", inputs: [], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "name", inputs: [], outputs: [{ name: "", type: "string" }] },
];

export function getErc20AbiBase64(): string {
  return Buffer.from(JSON.stringify(ERC20_ABI)).toString("base64");
}

const WELL_KNOWN_EVENTS: Record<string, string> = {
  transfer: "Transfer(address,address,uint256)",
  approval: "Approval(address,address,uint256)",
  ownershiptransferred: "OwnershipTransferred(address,address)",
  lowbalance: "LowBalance(address,uint256)",
  deposit: "Deposit(address,uint256)",
  withdrawal: "Withdrawal(address,uint256)",
  swap: "Swap(address,uint256,uint256,uint256,uint256,address)",
  mint: "Mint(address,uint256,uint256)",
  burn: "Burn(address,uint256,uint256,address)",
};

const WELL_KNOWN_FUNCTIONS: Record<string, string> = {
  transfer: "function transfer(address to, uint256 amount)",
  approve: "function approve(address spender, uint256 amount)",
  transferfrom: "function transferFrom(address from, address to, uint256 amount)",
  balanceof: "function balanceOf(address account)",
  mint: "function mint(address to, uint256 amount)",
  burn: "function burn(uint256 amount)",
  mintreward: "function mintReward(address to)",
};

export function resolveWellKnownEvent(eventName: string): string {
  if (eventName.includes("(")) return eventName;
  return WELL_KNOWN_EVENTS[eventName.toLowerCase()] ?? "Transfer(address,address,uint256)";
}

export function resolveWellKnownFunction(funcName: string): string {
  if (funcName.startsWith("function ")) return funcName;
  return WELL_KNOWN_FUNCTIONS[funcName.toLowerCase()] ?? funcName;
}

// ── Workflow defaults ───────────────────────────────────────────────────

export function triggerDefaults(chainId: number): Record<string, unknown> {
  return {
    TriggerSourceContract: "0x0000000000000000000000000000000000000000",
    TriggerChainID: chainId,
    TriggerSourceContractABI: "W10=",
    TriggerEventName: "Transfer(address,address,uint256)",
    TriggerEventFilter: "NA",
    RecurringSourceContract: "0x0000000000000000000000000000000000000000",
    RecurringChainID: chainId,
    RecurringSourceContractABI: "W10=",
    RecurringEventName: "Transfer(address,address,uint256)",
    RecurringEventFilter: "NA",
    ActionStatusNotificationPOSTURL: "NA",
    ActionStatusNotificationAPIKey: "NA",
    Meta: "NA",
  };
}

export function actionDefaults(chainId: number): Record<string, unknown> {
  return {
    ChainID: chainId,
    TargetContract: "NA",
    TargetFunction: "NA",
    TargetParams: [],
    EncodedABI: "NA",
    Metadata: "NA",
  };
}

export function normalizeExpiresIn(value: string | number | undefined): number | undefined {
  if (value === undefined) return undefined;
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return undefined;
  if (num < 1_000_000_000) {
    return Math.floor(Date.now() / 1000) + num;
  }
  return num;
}

export function normalizeInterval(seconds: number): string {
  const secs = Math.max(seconds, 60);
  if (secs >= 3600 && secs % 3600 === 0) return `${secs / 3600}h`;
  return `${Math.ceil(secs / 60)}m`;
}

export function cronToInterval(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts[0]?.startsWith("*/")) {
    const mins = parseInt(parts[0].slice(2), 10);
    if (!Number.isNaN(mins)) return normalizeInterval(mins * 60);
  }
  if (parts.length >= 2 && parts[1]?.startsWith("*/")) {
    const hrs = parseInt(parts[1].slice(2), 10);
    if (!Number.isNaN(hrs)) return `${hrs}h`;
  }
  if (parts.length >= 2 && !parts[1]?.includes("*") && !parts[1]?.includes("/")) {
    return "24h";
  }
  return "24h";
}

// ── Templates ───────────────────────────────────────────────────────────

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger_type: string;
  actions: string[];
  chains: string[];
  yaml: string;
}

export const TEMPLATES: WorkflowTemplate[] = [
  {
    id: "token-transfer-alert",
    name: "Token Transfer Alert",
    description: "Get notified on Telegram when tokens are transferred on any supported chain.",
    category: "alerts",
    trigger_type: "event",
    actions: ["Telegram notification"],
    chains: ["any"],
    yaml: `Name: TokenTransferAlert
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
  Mode: sequential`,
  },
  {
    id: "treasury-deposit-notifier",
    name: "Treasury Deposit Notifier",
    description: "Monitor any wallet for incoming transactions and send notifications to Discord.",
    category: "monitoring",
    trigger_type: "address_tracking",
    actions: ["Discord webhook", "Backend webhook"],
    chains: ["Base"],
    yaml: `Name: TreasuryDepositNotifier
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
Execution:
  Mode: sequential`,
  },
  {
    id: "oracle-price-alert",
    name: "Oracle Price Alert",
    description: "Get alerted when a token price drops below a threshold.",
    category: "alerts",
    trigger_type: "oracle_price",
    actions: ["Telegram notification"],
    chains: ["any"],
    yaml: `Name: SOLPriceDropAlert
Trigger:
  TriggerPrice: 150.0
  ExecuteAfter: "oracle_price"
  RepeatEvery: "oracle_price"
  ExpiresIn: 2592000
Actions:
  - Name: AlertTelegram
    Type: post
    APIEndpoint: "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage"
    APIPayload:
      chat_id: "<YOUR_CHAT_ID>"
      text: "SOL has dropped below $150!"
    RetriesUntilSuccess: 3
Execution:
  Mode: sequential`,
  },
  {
    id: "address-tracker",
    name: "Address Tracker",
    description: "Track any wallet address for all activity and forward to a webhook.",
    category: "monitoring",
    trigger_type: "address_tracking",
    actions: ["Webhook POST"],
    chains: ["Polygon"],
    yaml: `Name: WalletActivityTracker
Trigger:
  TriggerSourceContract: "0xWalletToTrack"
  TriggerChainID: 137
  ExecuteAfter: "address_tracking"
  RepeatEvery: "address_tracking"
  ExpiresIn: 604800
Actions:
  - Name: ForwardToWebhook
    Type: post
    APIEndpoint: "https://your-api.com/webhook/activity"
    APIPayload:
      type: "address_activity"
      receipt: "re.event(0)"
    RetriesUntilSuccess: 5
Execution:
  Mode: sequential`,
  },
  {
    id: "auto-topup-wallet",
    name: "Auto Top-Up Wallet",
    description: "Automatically transfer USDC when a low balance event is detected.",
    category: "defi",
    trigger_type: "event",
    actions: ["USDC transfer", "Telegram notification"],
    chains: ["Base"],
    yaml: `Name: AutoTopUpWallet
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
    APIEndpoint: "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage"
    APIPayload:
      chat_id: "<YOUR_CHAT_ID>"
      text: "Auto top-up sent 1 USDC to re.event(0)"
    RetriesUntilSuccess: 3
Execution:
  Mode: sequential`,
  },
  {
    id: "nft-reward-mint",
    name: "NFT Reward Mint",
    description: "Mint a reward NFT when a purchase exceeds a threshold.",
    category: "nft",
    trigger_type: "event",
    actions: ["NFT mint", "Telegram notification"],
    chains: ["Polygon Amoy"],
    yaml: `Name: NFTRewardOnPurchase
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
    APIEndpoint: "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage"
    APIPayload:
      chat_id: "<YOUR_CHAT_ID>"
      text: "Reward NFT minted for buyer re.event(0)!"
    RetriesUntilSuccess: 3
Execution:
  Mode: sequential`,
  },
];

// ── YAML validation schema ──────────────────────────────────────────────

import { z } from "zod";
import YAML from "yaml";

const TriggerSchema = z
  .object({
    TriggerSourceContract: z.string().optional(),
    TriggerChainID: z.number().optional(),
    TriggerEventName: z.string().optional(),
    TriggerEventFilter: z.string().optional(),
    TriggerSourceContractABI: z.string().optional(),
    RecurringSourceContract: z.string().optional(),
    RecurringChainID: z.number().optional(),
    RecurringEventName: z.string().optional(),
    RecurringEventFilter: z.string().optional(),
    RecurringSourceContractABI: z.string().optional(),
    ExecuteAfter: z.union([z.string(), z.number()]),
    RepeatEvery: z.union([z.string(), z.number()]),
    ExpiresIn: z.union([z.string(), z.number()]).optional(),
    TriggerPrice: z.number().optional(),
    RecurringPrice: z.number().optional(),
    Meta: z.string().optional(),
    ActionStatusNotificationPOSTURL: z.string().optional(),
    ActionStatusNotificationAPIKey: z.string().optional(),
  })
  .passthrough();

const CallActionSchema = z.object({
  Name: z.string(),
  Type: z.literal("call"),
  TargetContract: z.string(),
  TargetFunction: z.string(),
  TargetParams: z.array(z.union([z.string(), z.number()])),
  ChainID: z.number(),
  EncodedABI: z.string().default("NA"),
  Metadata: z.string().default("NA"),
  RetriesUntilSuccess: z.number().default(3),
});

const PostActionSchema = z.object({
  Name: z.string(),
  Type: z.enum(["post", "api"]),
  APIEndpoint: z.string(),
  APIPayload: z.record(z.string(), z.unknown()),
  RetriesUntilSuccess: z.number().default(3),
});

const DeployActionSchema = z.object({
  Name: z.string(),
  Type: z.literal("deploy"),
  Bytecode: z.string(),
  EncodedABI: z.string().optional(),
  InitializationArgs: z.array(z.string()).optional(),
  ChainID: z.number(),
  RetriesUntilSuccess: z.number().default(3),
});

const ActionSchema = z.union([CallActionSchema, PostActionSchema, DeployActionSchema]);

const WorkflowSchema = z.object({
  Name: z.string().min(1),
  Trigger: TriggerSchema,
  Actions: z.array(ActionSchema).min(1).max(10),
  Execution: z.object({ Mode: z.enum(["sequential", "parallel"]) }),
});

export type KwalangWorkflow = z.infer<typeof WorkflowSchema>;

export function validateWorkflow(yamlString: string): {
  valid: boolean;
  errors?: string[];
  parsed?: KwalangWorkflow;
} {
  try {
    const parsed = YAML.parse(yamlString);
    const result = WorkflowSchema.safeParse(parsed);
    if (result.success) {
      return { valid: true, parsed: result.data };
    }
    return {
      valid: false,
      errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  } catch (e) {
    return {
      valid: false,
      errors: [`YAML parse error: ${e instanceof Error ? e.message : String(e)}`],
    };
  }
}

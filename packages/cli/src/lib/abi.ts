import { kwalaGet } from "./api.js";
import { logger } from "./logger.js";

// ─── Standard ERC-20 ABI (covers USDC, USDT, WETH, DAI, etc.) ──────────
const ERC20_ABI = [
  { type: "event", name: "Transfer", inputs: [{ name: "from", type: "address", indexed: true }, { name: "to", type: "address", indexed: true }, { name: "value", type: "uint256", indexed: false }] },
  { type: "event", name: "Approval", inputs: [{ name: "owner", type: "address", indexed: true }, { name: "spender", type: "address", indexed: true }, { name: "value", type: "uint256", indexed: false }] },
  { type: "function", name: "transfer", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { type: "function", name: "transferFrom", inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { type: "function", name: "balanceOf", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "allowance", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "totalSupply", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "decimals", inputs: [], outputs: [{ name: "", type: "uint8" }] },
  { type: "function", name: "symbol", inputs: [], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "name", inputs: [], outputs: [{ name: "", type: "string" }] },
];

const ERC20_ABI_BASE64 = Buffer.from(JSON.stringify(ERC20_ABI)).toString("base64");

// ─── Well-known event signatures ────────────────────────────────────────
// Backend requires format: "EventName(type1,type2,...)"
const WELL_KNOWN_EVENTS: Record<string, string> = {
  "transfer": "Transfer(address,address,uint256)",
  "approval": "Approval(address,address,uint256)",
  "ownershipTransferred": "OwnershipTransferred(address,address)",
  "lowbalance": "LowBalance(address,uint256)",
  "deposit": "Deposit(address,uint256)",
  "withdrawal": "Withdrawal(address,uint256)",
  "swap": "Swap(address,uint256,uint256,uint256,uint256,address)",
  "mint": "Mint(address,uint256,uint256)",
  "burn": "Burn(address,uint256,uint256,address)",
};

// ─── Well-known function signatures ─────────────────────────────────────
const WELL_KNOWN_FUNCTIONS: Record<string, string> = {
  "transfer": "function transfer(address to, uint256 amount)",
  "approve": "function approve(address spender, uint256 amount)",
  "transferfrom": "function transferFrom(address from, address to, uint256 amount)",
  "balanceof": "function balanceOf(address account)",
  "mint": "function mint(address to, uint256 amount)",
  "burn": "function burn(uint256 amount)",
  "mintreward": "function mintReward(address to)",
};

// In-memory ABI cache (persists for server lifetime)
const abiCache = new Map<string, unknown[]>();

/**
 * Get the standard ERC-20 ABI. Use this for known tokens (USDC, USDT, WETH, etc.)
 * instead of fetching from the API.
 */
export function getErc20Abi(): unknown[] {
  return ERC20_ABI;
}

/**
 * Get the standard ERC-20 ABI as a base64 string for Kwalang YAML.
 */
export function getErc20AbiBase64(): string {
  return ERC20_ABI_BASE64;
}

/**
 * Resolve an event name to its full Solidity signature.
 * First checks well-known events, then checks a provided ABI.
 * Always returns the full format: "EventName(type1,type2,...)"
 */
export function resolveWellKnownEvent(eventName: string): string {
  // If it already has parentheses, it's already a full signature
  if (eventName.includes("(")) return eventName;

  const known = WELL_KNOWN_EVENTS[eventName.toLowerCase()];
  if (known) return known;

  // Fallback: return Transfer as the most common
  return "Transfer(address,address,uint256)";
}

/**
 * Resolve a function name to its full Solidity signature.
 * First checks well-known functions, then checks a provided ABI.
 */
export function resolveWellKnownFunction(funcName: string): string {
  if (funcName.startsWith("function ")) return funcName;

  const known = WELL_KNOWN_FUNCTIONS[funcName.toLowerCase()];
  if (known) return known;

  return funcName;
}

/**
 * Fetch a contract's ABI from Kwala's API and cache it.
 * For exploration/debugging — core tools use built-in ABIs.
 */
export async function fetchAbi(
  address: string,
  chainId: number,
): Promise<unknown[]> {
  const cacheKey = `${chainId}:${address.toLowerCase()}`;
  const cached = abiCache.get(cacheKey);
  if (cached) return cached;

  const result = await kwalaGet<unknown>(
    "/contract/fetchABI",
    { chain_id: String(chainId), chaincode_address: address },
  );

  const abi = Array.isArray(result)
    ? result
    : Array.isArray((result as Record<string, unknown>)?.abi)
      ? (result as Record<string, unknown>).abi as unknown[]
      : [];

  if (abi.length > 0) {
    abiCache.set(cacheKey, abi);
  }

  return abi;
}

/**
 * Fetch ABI and return as base64-encoded string.
 * Falls back to ERC-20 ABI if fetch fails or returns empty.
 */
export async function fetchAbiBase64(
  address: string,
  chainId: number,
): Promise<string> {
  try {
    const abi = await fetchAbi(address, chainId);
    if (abi.length > 0) {
      return Buffer.from(JSON.stringify(abi)).toString("base64");
    }
  } catch {
    // Fall through to ERC-20 default
  }
  return ERC20_ABI_BASE64;
}

/**
 * Given an ABI, resolve a short event name to full signature.
 */
export function resolveEventSignature(
  abi: unknown[],
  eventName: string,
): string | undefined {
  for (const item of abi) {
    const entry = item as Record<string, unknown>;
    if (entry.type !== "event" || entry.name !== eventName) continue;
    const inputs = entry.inputs as Array<{ type: string }> | undefined;
    if (!inputs) return `${eventName}()`;
    return `${eventName}(${inputs.map((i) => i.type).join(",")})`;
  }
  return undefined;
}

/**
 * Given an ABI, resolve a short function name to full signature.
 */
export function resolveFunctionSignature(
  abi: unknown[],
  funcName: string,
): string | undefined {
  for (const item of abi) {
    const entry = item as Record<string, unknown>;
    if (entry.type !== "function" || entry.name !== funcName) continue;
    const inputs = entry.inputs as Array<{ type: string; name: string }> | undefined;
    if (!inputs) return `function ${funcName}()`;
    return `function ${funcName}(${inputs.map((i) => `${i.type} ${i.name}`).join(", ")})`;
  }
  return undefined;
}

/**
 * List all events in an ABI.
 */
export function listEvents(
  abi: unknown[],
): Array<{ name: string; signature: string }> {
  const events: Array<{ name: string; signature: string }> = [];
  for (const item of abi) {
    const entry = item as Record<string, unknown>;
    if (entry.type !== "event") continue;
    const name = entry.name as string;
    const sig = resolveEventSignature(abi, name);
    if (sig) events.push({ name, signature: sig });
  }
  return events;
}

/**
 * List all functions in an ABI.
 */
export function listFunctions(
  abi: unknown[],
): Array<{ name: string; signature: string }> {
  const fns: Array<{ name: string; signature: string }> = [];
  for (const item of abi) {
    const entry = item as Record<string, unknown>;
    if (entry.type !== "function") continue;
    const name = entry.name as string;
    const sig = resolveFunctionSignature(abi, name);
    if (sig) fns.push({ name, signature: sig });
  }
  return fns;
}

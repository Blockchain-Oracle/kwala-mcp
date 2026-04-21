import type { ChainInfo } from "./types.js";

export const CHAINS: ChainInfo[] = [
  // Mainnets
  { id: 1, name: "Ethereum", network: "mainnet", symbol: "ETH" },
  { id: 56, name: "BNB Chain", network: "mainnet", symbol: "BNB" },
  { id: 137, name: "Polygon", network: "mainnet", symbol: "MATIC" },
  { id: 43114, name: "Avalanche C-Chain", network: "mainnet", symbol: "AVAX" },
  { id: 42220, name: "Celo", network: "mainnet", symbol: "CELO" },
  { id: 8453, name: "Base", network: "mainnet", symbol: "ETH" },
  // Testnets
  { id: 11155111, name: "Sepolia", network: "testnet", symbol: "ETH", testnetOf: 1 },
  { id: 80002, name: "Polygon Amoy", network: "testnet", symbol: "MATIC", testnetOf: 137 },
  { id: 43113, name: "Avalanche Fuji", network: "testnet", symbol: "AVAX", testnetOf: 43114 },
  { id: 84532, name: "Base Sepolia", network: "testnet", symbol: "ETH", testnetOf: 8453 },
  // Internal
  { id: 1905, name: "Kalp Chain", network: "internal", symbol: "GINI" },
];

const BY_ID = new Map(CHAINS.map((c) => [c.id, c]));

// Lowercase name → chain for fuzzy matching
const BY_NAME = new Map<string, ChainInfo>();
for (const c of CHAINS) {
  BY_NAME.set(c.name.toLowerCase(), c);
}
// Add common aliases
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

export function isSupported(chainId: number): boolean {
  return BY_ID.has(chainId);
}

/**
 * Resolve a fuzzy chain input to a chain ID.
 * Accepts: "Base", "base", "8453", "base sepolia", etc.
 * If testnet=true and input resolves to a mainnet, returns the testnet equivalent.
 */
export function resolveChainId(
  input: string,
  testnet = true,
): number | undefined {
  const chain = getChain(input);
  if (!chain) return undefined;

  if (testnet && chain.network === "mainnet") {
    const testnetChain = getTestnetFor(chain.id);
    return testnetChain?.id ?? chain.id;
  }

  return chain.id;
}

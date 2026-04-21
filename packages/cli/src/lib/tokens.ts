import type { TokenInfo } from "./types.js";

/**
 * Well-known token registry.
 * When a user says "USDC on Base", we resolve the contract address automatically.
 */
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
      // Testnets
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

/**
 * Resolve a token by name/symbol and chain to its contract address.
 * Returns undefined if the token or chain is not in the registry.
 */
export function resolveToken(
  nameOrSymbol: string,
  chainId: number,
): string | undefined {
  const token = BY_SYMBOL.get(nameOrSymbol.toLowerCase().trim());
  if (!token) return undefined;
  return token.addresses[chainId];
}

/**
 * Get token info by symbol or name.
 */
export function getToken(nameOrSymbol: string): TokenInfo | undefined {
  return BY_SYMBOL.get(nameOrSymbol.toLowerCase().trim());
}

/**
 * List all known tokens.
 */
export function listTokens(): TokenInfo[] {
  return TOKENS;
}

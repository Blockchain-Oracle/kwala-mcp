/** Kwala Network chain configuration constants */
export const KWALA_CHAIN_ID = 1905;
export const KWALA_CHAIN_NAME = "KWALA";
export const KWALA_RPC_URL = "https://rpc-ohio.kwala.network";
export const KWALA_NATIVE_CURRENCY_NAME = "GINI";
export const KWALA_NATIVE_CURRENCY_SYMBOL = "GINI";
export const KWALA_NATIVE_CURRENCY_DECIMALS = 18;

/** Kwala contract address on chain 1905 */
export const KWALA_CONTRACT_ADDRESS =
  "0x3e0c606d0ce3f0dec6c569a586a59128a1d9613e";

/** WalletConnect project ID — required for RainbowKit */
export const WALLET_CONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? "kwala-mcp-dev";

/** Header key for passing wallet address to API routes */
export const WALLET_ADDRESS_HEADER = "x-wallet-address";

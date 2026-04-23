import { defineChain } from "viem";
import {
  KWALA_CHAIN_ID,
  KWALA_CHAIN_NAME,
  KWALA_RPC_URL,
  KWALA_NATIVE_CURRENCY_NAME,
  KWALA_NATIVE_CURRENCY_SYMBOL,
  KWALA_NATIVE_CURRENCY_DECIMALS,
} from "./constants";

/** Custom chain definition for KWALA Network (chain 1905) */
export const kwalaChain = defineChain({
  id: KWALA_CHAIN_ID,
  name: KWALA_CHAIN_NAME,
  nativeCurrency: {
    name: KWALA_NATIVE_CURRENCY_NAME,
    symbol: KWALA_NATIVE_CURRENCY_SYMBOL,
    decimals: KWALA_NATIVE_CURRENCY_DECIMALS,
  },
  rpcUrls: {
    default: {
      http: [KWALA_RPC_URL],
    },
  },
});

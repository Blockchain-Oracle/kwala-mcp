"use client";

import { http, createConfig, createStorage, cookieStorage } from "wagmi";
import { KWALA_RPC_URL } from "./constants";
import { baseSepolia, sepolia, polygonAmoy } from "wagmi/chains";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  injectedWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { kwalaChain } from "./chains";
import { WALLET_CONNECT_PROJECT_ID } from "./constants";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Popular",
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        walletConnectWallet,
        injectedWallet,
      ],
    },
  ],
  {
    appName: "kwala-mcp",
    projectId: WALLET_CONNECT_PROJECT_ID,
  },
);

/** Wagmi configuration with KWALA and testnet chains */
export const wagmiConfig = createConfig({
  connectors,
  chains: [kwalaChain, baseSepolia, sepolia, polygonAmoy],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [kwalaChain.id]: http(KWALA_RPC_URL, { batch: false }),
    [baseSepolia.id]: http(),
    [sepolia.id]: http(),
    [polygonAmoy.id]: http(),
  },
});

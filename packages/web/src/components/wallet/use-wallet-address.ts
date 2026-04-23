"use client";

import { useSyncExternalStore } from "react";

/**
 * Returns the connected wallet address, or undefined if not connected.
 *
 * Uses wagmi's action-based API (watchAccount/getAccount) instead of
 * the useAccount hook, so it works even when WagmiProvider hasn't
 * mounted yet (during SSR or before the deferred provider loads).
 */
export function useWalletAddress(): string | undefined {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
}

function getServerSnapshot(): string | undefined {
  return undefined;
}

let cachedAddress: string | undefined;
let configLoaded = false;
const listeners = new Set<() => void>();

function getSnapshot(): string | undefined {
  return cachedAddress;
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);

  if (!configLoaded) {
    configLoaded = true;
    loadConfig(onStoreChange);
  }

  return () => {
    listeners.delete(onStoreChange);
  };
}

async function loadConfig(_onStoreChange: () => void) {
  try {
    const [{ wagmiConfig }, { getAccount, watchAccount }] = await Promise.all([
      import("@/lib/wallet/config"),
      import("wagmi/actions"),
    ]);

    const account = getAccount(wagmiConfig);
    cachedAddress = account?.address;
    notifyListeners();

    watchAccount(wagmiConfig, {
      onChange: (account) => {
        cachedAddress = account?.address;
        notifyListeners();
      },
    });
  } catch {
    // wagmi not available yet, address stays undefined
  }
}

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

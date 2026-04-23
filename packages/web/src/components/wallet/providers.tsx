"use client";

import { type ReactNode, useState, useEffect } from "react";

interface WalletProvidersProps {
  children: ReactNode;
}

/**
 * Provides wagmi, react-query, and RainbowKit context to the app.
 *
 * WalletConnect connectors access indexedDB at module-init time,
 * so we defer the entire provider tree to client-only via dynamic import.
 */
export function WalletProviders({ children }: WalletProvidersProps) {
  const [Providers, setProviders] = useState<React.ComponentType<{
    children: ReactNode;
  }> | null>(null);

  useEffect(() => {
    import("./providers-inner").then((mod) => {
      setProviders(() => mod.WalletProvidersInner);
    });
  }, []);

  if (!Providers) {
    return <>{children}</>;
  }

  return <Providers>{children}</Providers>;
}

"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

function ConnectButtonPlaceholder() {
  return (
    <button
      type="button"
      disabled
      className={cn(
        "flex items-center gap-2",
        "rounded-full border border-border bg-card px-4 py-1.5",
        "font-mono text-[11px] tracking-[0.12em] font-semibold uppercase",
        "text-muted-foreground cursor-default opacity-60",
      )}
    >
      <Wallet className="size-3.5" />
      Connect
    </button>
  );
}

interface RKRenderProps {
  account?: { displayName: string };
  chain?: { unsupported?: boolean; hasIcon?: boolean; iconUrl?: string; name?: string };
  openAccountModal: () => void;
  openChainModal: () => void;
  openConnectModal: () => void;
  mounted: boolean;
}

export function ConnectButton() {
  const [renderProps, setRenderProps] = useState<RKRenderProps | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Wait for provider to be available by checking if config exists
        const { wagmiConfig } = await import("@/lib/wallet/config");
        const { getAccount } = await import("wagmi/actions");

        // Test that the config is usable (provider is mounted)
        getAccount(wagmiConfig);

        if (cancelled) return;
        setReady(true);
      } catch {
        // Provider not ready yet, retry
        if (!cancelled) {
          setTimeout(init, 100);
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  if (!ready) {
    return <ConnectButtonPlaceholder />;
  }

  return <ConnectButtonInner />;
}

function ConnectButtonInner() {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import("@rainbow-me/rainbowkit").then((mod) => {
      const RKConnectButton = mod.ConnectButton;

      setComponent(() => {
        return function WrappedConnectButton() {
          return (
            <RKConnectButton.Custom>
              {(props) => <ConnectButtonUI {...props} />}
            </RKConnectButton.Custom>
          );
        };
      });
    });
  }, []);

  if (!Component) return <ConnectButtonPlaceholder />;
  return <Component />;
}

function ConnectButtonUI({
  account,
  chain,
  openAccountModal,
  openChainModal,
  openConnectModal,
  mounted,
}: RKRenderProps) {
  const connected = mounted && account && chain;

  return (
    <div
      {...(!mounted && {
        "aria-hidden": true,
        style: { opacity: 0, pointerEvents: "none" as const, userSelect: "none" as const },
      })}
    >
      {!connected ? (
        <button
          onClick={openConnectModal}
          type="button"
          className={cn(
            "flex items-center gap-2",
            "rounded-full border border-border bg-card px-4 py-1.5",
            "font-mono text-[11px] tracking-[0.12em] font-semibold uppercase",
            "text-foreground transition-all duration-150",
            "hover:bg-primary hover:text-primary-foreground hover:border-primary/20",
          )}
        >
          <Wallet className="size-3.5" />
          Connect
        </button>
      ) : chain.unsupported ? (
        <button
          onClick={openChainModal}
          type="button"
          className={cn(
            "flex items-center gap-2",
            "rounded-full border border-destructive/30 bg-destructive/10 px-4 py-1.5",
            "font-mono text-[11px] tracking-[0.12em] font-semibold uppercase",
            "text-destructive transition-all duration-150",
            "hover:bg-destructive/20",
          )}
        >
          Wrong Network
        </button>
      ) : (
        <div className="flex items-center gap-1.5">
          <button
            onClick={openChainModal}
            type="button"
            className={cn(
              "flex items-center gap-1.5",
              "rounded-full border border-border bg-card px-3 py-1.5",
              "text-xs text-muted-foreground transition-all duration-150",
              "hover:bg-muted/40 hover:text-foreground",
            )}
          >
            {chain.hasIcon && chain.iconUrl && (
              <img alt={chain.name ?? "Chain"} src={chain.iconUrl} className="size-3.5 rounded-full" />
            )}
            <span className="hidden sm:inline">{chain.name}</span>
          </button>
          <button
            onClick={openAccountModal}
            type="button"
            className={cn(
              "flex items-center gap-2",
              "rounded-full border border-border bg-card px-4 py-1.5",
              "font-mono text-[11px] tracking-[0.12em] font-semibold",
              "text-foreground transition-all duration-150",
              "hover:bg-muted/40",
            )}
          >
            <div className="size-2 rounded-full bg-green-500 animate-pulse" />
            {account.displayName}
          </button>
        </div>
      )}
    </div>
  );
}

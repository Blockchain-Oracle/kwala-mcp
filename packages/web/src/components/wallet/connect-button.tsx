"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Placeholder button shown before the wallet provider loads.
 * Matches the visual style of the real connect button.
 */
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

/**
 * Lazily loaded inner component that uses RainbowKit's ConnectButton.
 * Deferred to avoid importing wagmi hooks during SSR.
 */
function LazyConnectButtonInner({
  children,
}: {
  children: (props: {
    account?: { displayName: string };
    chain?: { unsupported?: boolean; hasIcon?: boolean; iconUrl?: string; name?: string };
    openAccountModal: () => void;
    openChainModal: () => void;
    openConnectModal: () => void;
    mounted: boolean;
  }) => ReactNode;
}) {
  const [Inner, setInner] = useState<React.ComponentType<{
    children: typeof children;
  }> | null>(null);

  useEffect(() => {
    import("@rainbow-me/rainbowkit").then((mod) => {
      const RKButton = mod.ConnectButton;
      // Wrap the Custom render prop component
      setInner(() => {
        return function InnerButton({ children: renderFn }: { children: typeof children }) {
          return (
            <RKButton.Custom>
              {(props) => renderFn(props)}
            </RKButton.Custom>
          );
        };
      });
    });
  }, []);

  if (!Inner) {
    return <ConnectButtonPlaceholder />;
  }

  return <Inner>{children}</Inner>;
}

/** Custom-styled RainbowKit connect button matching the purple theme */
export function ConnectButton() {
  return (
    <LazyConnectButtonInner>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const connected = mounted && account && chain;

        return (
          <div
            {...(!mounted && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none" as const,
                userSelect: "none" as const,
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
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
                );
              }

              if (chain.unsupported) {
                return (
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
                );
              }

              return (
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
                      <img
                        alt={chain.name ?? "Chain"}
                        src={chain.iconUrl}
                        className="size-3.5 rounded-full"
                      />
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
              );
            })()}
          </div>
        );
      }}
    </LazyConnectButtonInner>
  );
}

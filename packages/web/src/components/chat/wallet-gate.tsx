"use client";

import { useWalletAddress } from "@/components/wallet/use-wallet-address";
import { ConnectButton } from "@/components/wallet/connect-button";
import { Wallet } from "lucide-react";

interface WalletGateProps {
  children: React.ReactNode;
}

export function WalletGate({ children }: WalletGateProps) {
  const address = useWalletAddress();

  if (!address) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-6 max-w-md text-center px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Connect Your Wallet
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Connect your wallet to start creating and deploying blockchain
              automations with AI. Your wallet address is used to sign
              transactions and deploy workflows on-chain.
            </p>
          </div>
          <ConnectButton />
          <p className="text-xs text-muted-foreground">
            Supports MetaMask, Coinbase Wallet, WalletConnect, and more.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

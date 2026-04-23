"use client";

import { Sidebar } from "@/components/chat/sidebar";
import { WalletGate } from "@/components/chat/wallet-gate";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletGate>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </WalletGate>
  );
}

"use client";

import { useState } from "react";
import { Sidebar } from "@/components/chat/sidebar";
import { WalletGate } from "@/components/chat/wallet-gate";
import { PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <WalletGate>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Desktop sidebar — always visible */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile sidebar — drawer overlay */}
        {mobileOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <div
          className={cn(
            "md:hidden fixed inset-y-0 left-0 z-50 w-[280px]",
            "bg-background transition-transform duration-300 ease-in-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </div>

        {/* Main chat area */}
        <main className="flex-1 overflow-hidden relative">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className={cn(
              "md:hidden absolute top-3 left-3 z-30",
              "p-2 rounded-lg",
              "bg-card/80 backdrop-blur-sm border border-border/50",
              "text-muted-foreground hover:text-foreground",
              "transition-colors",
            )}
            aria-label="Open sidebar"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
          {children}
        </main>
      </div>
    </WalletGate>
  );
}

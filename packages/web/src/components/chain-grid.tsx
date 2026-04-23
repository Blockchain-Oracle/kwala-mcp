import { cn } from "@/lib/utils";

const chains = [
  { name: "Ethereum", id: "1", color: "oklch(0.65 0.10 250)" },
  { name: "Base", id: "8453", color: "oklch(0.60 0.15 240)" },
  { name: "Polygon", id: "137", color: "oklch(0.65 0.18 290)" },
  { name: "BNB Chain", id: "56", color: "oklch(0.75 0.18 90)" },
  { name: "Avalanche", id: "43114", color: "oklch(0.60 0.20 20)" },
  { name: "Celo", id: "42220", color: "oklch(0.75 0.18 150)" },
  { name: "Sepolia", id: "11155111", color: "oklch(0.55 0.08 250)" },
  { name: "Base Sepolia", id: "84532", color: "oklch(0.50 0.10 240)" },
  { name: "Polygon Amoy", id: "80002", color: "oklch(0.55 0.12 290)" },
  { name: "BNB Testnet", id: "97", color: "oklch(0.65 0.12 90)" },
  { name: "Fuji", id: "43113", color: "oklch(0.50 0.12 20)" },
  { name: "Celo Alfajores", id: "44787", color: "oklch(0.65 0.12 150)" },
];

export function ChainGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {chains.map((chain) => (
        <div
          key={chain.id}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl border border-border/70 bg-card",
            "hover:border-primary/30 transition-colors",
          )}
        >
          <span
            className="size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: chain.color }}
          />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-foreground truncate">
              {chain.name}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {chain.id}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

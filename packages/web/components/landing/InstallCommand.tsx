"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
 
const clients = [
  { name: "Claude Code", command: "claude mcp add kwala npx @kwala-dev/mcp" },
  { name: "Cursor", command: 'npx @kwala-dev/mcp  # add to mcp config' },
  { name: "Windsurf", command: 'npx @kwala-dev/mcp  # add to mcp config' },
  { name: "CLI", command: "npm install -g @kwala-dev/cli" },
];
 
export default function InstallCommand() {
  const [copied, setCopied] = useState<string | null>(null);
  const [active, setActive] = useState(0);
 
  const copy = (cmd: string, key: string) => {
    navigator.clipboard.writeText(cmd);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };
 
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Client tabs */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {clients.map((c, i) => (
          <button
            key={c.name}
            onClick={() => setActive(i)}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all ${
              active === i
                ? "border-purple-500 bg-purple-900/30 text-purple-300"
                : "border-[#1e1e2e] text-gray-500 hover:text-gray-300"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
 
      {/* Command block */}
      <div className="flex items-center gap-3 bg-[#111118] border border-[#1e1e2e] rounded-xl px-5 py-4 glow-purple">
        <span className="text-green-400 font-mono text-sm flex-1 truncate">
          $ {clients[active].command}
        </span>
        <button
          onClick={() => copy(clients[active].command, clients[active].name)}
          className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
        >
          {copied === clients[active].name ? (
            <Check size={16} className="text-green-400" />
          ) : (
            <Copy size={16} />
          )}
        </button>
      </div>
 
      <p className="text-center text-gray-600 text-xs font-mono mt-3">
        No API keys. No accounts. No dashboard.
      </p>
    </div>
  );
}

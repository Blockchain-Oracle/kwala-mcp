export default function Footer() {
  return (
    <footer className="border-t border-[#1e1e2e] py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div>
          <div className="font-bold text-lg mb-1">
            <span className="text-purple-400">kwala</span>
            <span className="text-green-400">-mcp</span>
          </div>
          <p className="text-gray-600 text-xs font-mono">
            Built for SchullTech × Kwala Hackathon 2026
          </p>
        </div>
 
        {/* Links */}
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <a
            href="https://kwala.network"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Kwala Network
          </a>
          <a
            href="https://discord.gg/RRn2ms7x"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Discord
          </a>
          <a
            href="https://dorahacks.io/hackathon/buildwithkwala"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            DoraHacks
          </a>
        </div>
 
        {/* Install command mini */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg px-4 py-2 font-mono text-xs text-green-400">
          $ claude mcp add kwala npx @kwala-dev/mcp
        </div>
      </div>
    </footer>
  );
}

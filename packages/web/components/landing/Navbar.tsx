import Link from "next/link";
 
export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1e1e2e] bg-[#0a0a0f]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-bold text-lg">
          <span className="text-purple-400">kwala</span>
          <span className="text-green-400">-mcp</span>
        </Link>
 
        {/* Links */}
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <Link href="/#how-it-works" className="hover:text-white transition-colors hidden md:block">
            How it works
          </Link>
          <Link href="/#tools" className="hover:text-white transition-colors hidden md:block">
            Tools
          </Link>
          <a
            href="https://kwala.network"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors hidden md:block"
          >
            Kwala Network
          </a>
          <a
            href="https://github.com/Blockchain-Oracle/kwala-mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono px-4 py-2 rounded-lg transition-colors"
          >
            GitHub →
          </a>
        </div>
      </div>
    </nav>
  );
}

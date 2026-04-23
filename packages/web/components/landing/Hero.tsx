import InstallCommand from "./InstallCommand";
 
export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 py-24 grid-bg overflow-hidden">
      {/* Glow orbs */}
      <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-purple-600 opacity-10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[100px] left-[-80px] w-[300px] h-[300px] rounded-full bg-green-500 opacity-10 blur-[120px] pointer-events-none" />
 
      {/* Badge */}
      <div className="inline-flex items-center gap-2 bg-purple-900/20 border border-purple-700/40 text-purple-400 text-xs font-mono tracking-widest uppercase px-4 py-2 rounded-full mb-8 animate-fade-up">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-dot" />
        SchullTech × Kwala Hackathon 2026
      </div>
 
      {/* Headline */}
      <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6 max-w-4xl animate-fade-up">
        Deploy{" "}
        <span className="gradient-text">Kwala Workflows</span>
        <br />
        with your{" "}
        <span className="text-green-400">AI Agent</span>
      </h1>
 
      {/* Subtext */}
      <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed animate-fade-up">
        kwala-mcp gives AI agents end-to-end ability to{" "}
        <span className="text-white font-medium">create</span>,{" "}
        <span className="text-white font-medium">verify</span>,{" "}
        <span className="text-white font-medium">deploy</span> and{" "}
        <span className="text-white font-medium">monitor</span> Kwala
        blockchain automations through natural language.{" "}
        <span className="text-purple-400">No dashboard needed.</span>
      </p>
 
      {/* Install command */}
      <div className="w-full max-w-2xl animate-fade-up">
        <InstallCommand />
      </div>
 
      {/* Supported clients */}
      <div className="mt-8 flex items-center gap-3 flex-wrap justify-center animate-fade-up">
        <span className="text-gray-600 text-xs font-mono">Works with</span>
        {["Claude", "Cursor", "Windsurf", "VS Code", "Codex", "Gemini CLI"].map(
          (client) => (
            <span
              key={client}
              className="text-gray-500 text-xs font-mono border border-[#1e1e2e] px-2 py-1 rounded"
            >
              {client}
            </span>
          )
        )}
      </div>
    </section>
  );
}

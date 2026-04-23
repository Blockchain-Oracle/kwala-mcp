import { tools, categoryColors } from "@/lib/tools-data";
 
export default function ToolsPreview() {
  return (
    <section className="py-24 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <p className="text-purple-400 font-mono text-xs tracking-widest uppercase mb-3">
          17 Tools
        </p>
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          Everything your agent needs
        </h2>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          From natural language workflow generation to on-chain deployment
          and live explorer queries.
        </p>
      </div>
 
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5 flex flex-col gap-3 hover:border-purple-700/50 transition-colors group"
          >
            {/* Category badge */}
            <span
              className={`self-start text-xs font-mono px-2 py-1 rounded border ${
                categoryColors[tool.category]
              }`}
            >
              {tool.category}
            </span>
 
            {/* Tool name */}
            <h3 className="font-mono text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
              {tool.name}
            </h3>
 
            {/* Description */}
            <p className="text-gray-400 text-xs leading-relaxed flex-1">
              {tool.description}
            </p>
 
            {/* Example */}
            <div className="bg-black/30 rounded-lg px-3 py-2 font-mono text-xs text-gray-500 italic">
              {tool.example}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

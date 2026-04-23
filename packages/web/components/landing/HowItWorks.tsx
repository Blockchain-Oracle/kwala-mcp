const steps = [
  {
    number: "01",
    title: "Describe your automation",
    description:
      "Tell your AI agent what you want in plain English. No YAML knowledge needed. No dashboard. Just natural language.",
    example:
      '"Notify me on Telegram when USDC is deposited to my treasury wallet on Base"',
    color: "text-purple-400",
    border: "border-purple-700/30",
    bg: "bg-purple-900/10",
  },
  {
    number: "02",
    title: "kwala-mcp generates & verifies",
    description:
      "The MCP server generates valid Kwalang YAML and verifies it against Kwala's actual backend — same as the dashboard compile button.",
    example: "✓ syntax_check: true\n✓ schema_validation: true\n✓ ready_to_deploy: true",
    color: "text-green-400",
    border: "border-green-700/30",
    bg: "bg-green-900/10",
  },
  {
    number: "03",
    title: "Deploys on-chain automatically",
    description:
      "Workflow is saved, deployed and activated on the Kwala chain (1905). Fully programmatic. No copy-paste. No manual steps.",
    example: 'workflow_id: "MyWorkflow_0xAbC123"\nstatus: "active"\nchaincode: "a479e076..."',
    color: "text-cyan-400",
    border: "border-cyan-700/30",
    bg: "bg-cyan-900/10",
  },
];
 
export default function HowItWorks() {
  return (
    <section className="py-24 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <p className="text-purple-400 font-mono text-xs tracking-widest uppercase mb-3">
          How it works
        </p>
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          From idea to live workflow
          <br />
          <span className="text-gray-500">in three steps</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Write YAML. Deploy. Done. That&apos;s the whole product — now
          accessible through natural language.
        </p>
      </div>
 
      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`${step.bg} border ${step.border} rounded-2xl p-8 flex flex-col gap-4 relative overflow-hidden`}
          >
            {/* Big number background */}
            <span
              className={`absolute top-4 right-4 text-8xl font-bold ${step.color} opacity-5 select-none`}
            >
              {step.number}
            </span>
 
            <span className={`text-4xl font-bold ${step.color}`}>
              {step.number}
            </span>
            <h3 className="text-xl font-bold">{step.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {step.description}
            </p>
            <div className="bg-black/40 rounded-lg px-4 py-3 font-mono text-xs text-gray-400 mt-auto whitespace-pre-line">
              {step.example}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

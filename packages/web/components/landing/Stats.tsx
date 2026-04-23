import { getTotalWorkflows, getTotalActions } from "@/lib/kwala-api";
 
export default async function Stats() {
  const workflows = await getTotalWorkflows();
  const actions = await getTotalActions();
 
  const stats = [
    {
      value: workflows.toLocaleString(),
      label: "Workflows Deployed",
      color: "text-purple-400",
    },
    {
      value: actions.toLocaleString(),
      label: "Actions Executed",
      color: "text-green-400",
    },
    {
      value: "17",
      label: "MCP Tools",
      color: "text-cyan-400",
    },
    {
      value: "10+",
      label: "Supported Chains",
      color: "text-amber-400",
    },
  ];
 
  return (
    <section className="py-16 px-6 border-y border-[#1e1e2e] bg-[#111118]/50">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className={`text-4xl md:text-5xl font-bold mb-2 ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-gray-500 text-sm font-mono">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

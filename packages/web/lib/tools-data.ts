export interface Tool {
  name: string;
  category: string;
  description: string;
  example: string;
}
 
export const tools: Tool[] = [
  {
    name: "kwala-create-automation",
    category: "Workflow Generation",
    description: "Generate a complete Kwalang YAML workflow from natural language",
    example: '"Notify me on Telegram when USDC lands in my wallet on Base"',
  },
  {
    name: "kwala-explain-yaml",
    category: "Workflow Generation",
    description: "Explain any Kwalang YAML workflow in plain English",
    example: '"What does this workflow do?"',
  },
  {
    name: "kwala-list-templates",
    category: "Workflow Generation",
    description: "Browse pre-built workflow templates by category",
    example: '"Show me all alert templates"',
  },
  {
    name: "kwala-build-trigger",
    category: "Workflow Generation",
    description: "Generate a trigger configuration for any event type",
    example: '"Build a trigger for USDC transfers on Base"',
  },
  {
    name: "kwala-build-action",
    category: "Workflow Generation",
    description: "Generate an action configuration for calls, APIs or deploys",
    example: '"Build a Telegram notification action"',
  },
  {
    name: "kwala-verify-workflow",
    category: "Deployment",
    description: "Verify YAML against Kwala's backend — same as dashboard compile",
    example: '"Verify this workflow before deploying"',
  },
  {
    name: "kwala-deploy-workflow",
    category: "Deployment",
    description: "Deploy and activate a workflow on-chain end-to-end",
    example: '"Deploy my token transfer alert now"',
  },
  {
    name: "kwala-workflow-status",
    category: "Deployment",
    description: "Check deployment and execution status of any workflow",
    example: '"Is MyWorkflow_0xABC still active?"',
  },
  {
    name: "kwala-list-workflows",
    category: "Deployment",
    description: "List all workflows deployed by your wallet address",
    example: '"Show me all my active workflows"',
  },
  {
    name: "kwala-explorer-stats",
    category: "Explorer",
    description: "Get live Kwala network statistics in real time",
    example: '"How many workflows are deployed on Kwala?"',
  },
  {
    name: "kwala-explorer-actions",
    category: "Explorer",
    description: "Browse paginated workflow execution logs",
    example: '"Show me the last 10 executions"',
  },
  {
    name: "kwala-get-workflow",
    category: "Explorer",
    description: "Fetch the full YAML of any deployed workflow by ID",
    example: '"Get the YAML for workflow-7asztwP9ANRc"',
  },
  {
    name: "kwala-fetch-abi",
    category: "Explorer",
    description: "Fetch any contract ABI on any Kwala-supported chain",
    example: '"Get the ABI for USDC on Base"',
  },
  {
    name: "kwala-list-chains",
    category: "System",
    description: "List all supported chains with IDs and network types",
    example: '"What chains does Kwala support?"',
  },
  {
    name: "kwala-tools",
    category: "System",
    description: "List all 17 available MCP tools with descriptions",
    example: '"What tools are available?"',
  },
  {
    name: "kwala-credit-balance",
    category: "Account",
    description: "Check your Kwala credit balance for running workflows",
    example: '"How many credits do I have left?"',
  },
  {
    name: "kwala-wallet",
    category: "Account",
    description: "Show or create your KWALA chain wallet for deployments",
    example: '"Show my wallet address"',
  },
];
 
export const categories = [
  "All",
  "Workflow Generation",
  "Deployment",
  "Explorer",
  "Account",
  "System",
];
 
export const categoryColors: Record<string, string> = {
  "Workflow Generation": "text-purple-400 bg-purple-900/20 border-purple-700/40",
  Deployment: "text-green-400 bg-green-900/20 border-green-700/40",
  Explorer: "text-cyan-400 bg-cyan-900/20 border-cyan-700/40",
  Account: "text-amber-400 bg-amber-900/20 border-amber-700/40",
  System: "text-gray-400 bg-gray-900/20 border-gray-700/40",
};

export type ToolCategory = "workflow-generation" | "deployment" | "explorer" | "account" | "system"

export interface Tool {
  name: string
  title: string
  description: string
  category: ToolCategory
  prompt: string
}

export const tools: Tool[] = [
  // -- Workflow Generation --
  {
    name: "kwala-create-automation",
    title: "Create Automation",
    description: "Generate a complete Kwalang YAML workflow from a natural-language description. Handles triggers, actions, and execution mode.",
    category: "workflow-generation",
    prompt: "Create a workflow that alerts me on Telegram when ETH drops below $2000",
  },
  {
    name: "kwala-explain-yaml",
    title: "Explain YAML",
    description: "Parse and explain an existing Kwalang YAML workflow in plain English -- triggers, actions, and execution flow.",
    category: "workflow-generation",
    prompt: "Explain this Kwalang workflow file and what it does",
  },
  {
    name: "kwala-list-templates",
    title: "List Templates",
    description: "Browse pre-built workflow templates for common automation patterns -- price alerts, transfer monitors, auto top-ups.",
    category: "workflow-generation",
    prompt: "Show me all available Kwalang workflow templates",
  },
  {
    name: "kwala-build-trigger",
    title: "Build Trigger",
    description: "Construct a trigger block for a Kwalang workflow -- event-based, price-based, or time-based triggers.",
    category: "workflow-generation",
    prompt: "Build a trigger that fires when USDC is transferred on Base",
  },
  {
    name: "kwala-build-action",
    title: "Build Action",
    description: "Construct an action block -- contract calls, API posts, or webhook notifications with retry logic.",
    category: "workflow-generation",
    prompt: "Build an action that calls a smart contract function on Ethereum",
  },

  // -- Deployment --
  {
    name: "kwala-verify-workflow",
    title: "Verify Workflow",
    description: "Validate a Kwalang YAML workflow against the schema and Kwala API before deploying on-chain.",
    category: "deployment",
    prompt: "Verify my workflow YAML is valid before deploying",
  },
  {
    name: "kwala-deploy-workflow",
    title: "Deploy Workflow",
    description: "Deploy a verified workflow on-chain to the Kwala Network (chain 1905). Saves, deploys, and activates in one step.",
    category: "deployment",
    prompt: "Deploy my price alert workflow to Kwala Network",
  },
  {
    name: "kwala-workflow-status",
    title: "Workflow Status",
    description: "Check the deployment status and chaincode address of a workflow by its ID.",
    category: "deployment",
    prompt: "What is the status of my deployed workflow?",
  },
  {
    name: "kwala-list-workflows",
    title: "List Workflows",
    description: "List all workflows deployed from your wallet with their IDs, names, and statuses.",
    category: "deployment",
    prompt: "Show all my deployed workflows on Kwala",
  },

  // -- Explorer --
  {
    name: "kwala-explorer-stats",
    title: "Explorer Stats",
    description: "Network-wide statistics from the Kwala explorer -- total workflows, transactions, and active automations.",
    category: "explorer",
    prompt: "Show me Kwala Network statistics",
  },
  {
    name: "kwala-explorer-actions",
    title: "Explorer Actions",
    description: "Browse recent actions executed across the Kwala Network -- contract calls, API posts, and notifications.",
    category: "explorer",
    prompt: "Show recent actions on Kwala Network",
  },
  {
    name: "kwala-get-workflow",
    title: "Get Workflow",
    description: "Fetch a specific workflow by ID from the Kwala Network including its full YAML definition.",
    category: "explorer",
    prompt: "Get the details of workflow ID abc123",
  },
  {
    name: "kwala-fetch-abi",
    title: "Fetch ABI",
    description: "Fetch and cache a smart contract ABI from any supported chain. Auto-resolves verified contracts.",
    category: "explorer",
    prompt: "Fetch the ABI for the USDC contract on Ethereum",
  },

  // -- Account --
  {
    name: "kwala-wallet",
    title: "Wallet Info",
    description: "Show your Kwala MCP wallet address, connected network, and on-chain balance.",
    category: "account",
    prompt: "Show my Kwala wallet address and balance",
  },
  {
    name: "kwala-credit-balance",
    title: "Credit Balance",
    description: "Check your Kwala credit balance used for workflow deployments and execution fees.",
    category: "account",
    prompt: "How many credits do I have on Kwala?",
  },
  {
    name: "kwala-configure",
    title: "Configure",
    description: "Set or update your Kwala MCP configuration -- wallet private key, default chain, API settings.",
    category: "account",
    prompt: "Configure my Kwala wallet with a new private key",
  },
  {
    name: "kwala-login",
    title: "Login",
    description: "Authenticate with the Kwala Network API to access deployment and management features.",
    category: "account",
    prompt: "Log in to my Kwala account",
  },

  // -- System --
  {
    name: "kwala-list-chains",
    title: "List Chains",
    description: "List all supported blockchains with chain IDs, RPC endpoints, and explorer URLs. Fuzzy name matching.",
    category: "system",
    prompt: "What chains does Kwala support?",
  },
  {
    name: "kwala-tools",
    title: "List Tools",
    description: "List all available Kwala MCP tools grouped by category -- discover what the server can do.",
    category: "system",
    prompt: "List all available Kwala MCP tools",
  },
]

export const categoryLabel: Record<ToolCategory, string> = {
  "workflow-generation": "Workflow Generation",
  deployment: "Deployment",
  explorer: "Explorer",
  account: "Account",
  system: "System",
}

export const categoryDescription: Record<ToolCategory, string> = {
  "workflow-generation": "AI-powered YAML generation",
  deployment: "On-chain to Kwala 1905",
  explorer: "Read-only, cached 5 min",
  account: "Wallet & config management",
  system: "Utility & discovery",
}

# @kwala-ai/mcp

MCP server for Kwala Network blockchain automation. Connects AI agents to 20 tools for creating, deploying, and monitoring on-chain workflows.

## Install

```bash
# Claude Code
claude mcp add kwala npx @kwala-ai/mcp

# Cursor / Windsurf / VS Code / Claude Desktop
# Add to MCP config:
#   { "command": "npx", "args": ["-y", "@kwala-ai/mcp"] }

# Gemini CLI
gemini mcp add kwala npx -y @kwala-ai/mcp
```

## What It Does

Tell your AI agent what to automate on any blockchain -- it generates the workflow, deploys it on-chain, and monitors it.

**Example prompts:**
- "Alert me on Telegram when ETH drops below $2000"
- "Monitor USDC transfers on Base and notify my Discord"
- "Track Vitalik's wallet for all activity"
- "Deploy a workflow that mints an NFT on purchase"

## Supported Chains

Ethereum, Base, Polygon, BNB Chain, Avalanche, Celo + testnets (Sepolia, Base Sepolia, Polygon Amoy, Avalanche Fuji)

## Links

- [Documentation](https://docs.kwala-ai.xyz)
- [Web App](https://kwala-ai.xyz)
- [GitHub](https://github.com/Blockchain-Oracle/kwala-mcp)
- [Agent Skill](https://kwala-ai.xyz/skill)

## License

MIT

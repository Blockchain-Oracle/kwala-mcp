# @kwala-ai/cli

Core library and CLI for Kwala Network blockchain automation. 20 tools for creating, verifying, deploying, and monitoring Kwalang YAML workflows via natural language.

## Install

```bash
npm install -g @kwala-ai/cli
kwala --help
```

## Usage

```bash
# Show your wallet
kwala wallet

# List supported chains
kwala list-chains

# Browse templates
kwala list-templates

# Verify a workflow
kwala verify-workflow workflow.yaml

# Deploy a workflow on-chain
kwala deploy-workflow workflow.yaml

# Check workflow status
kwala workflow-status MyWorkflow

# Deactivate a workflow
kwala deactivate-workflow MyWorkflow

# Configure Telegram notifications
kwala configure --telegram-token YOUR_TOKEN --telegram-chat YOUR_CHAT_ID

# Check credit balance
kwala credit-balance
```

## Tools (20)

| Category | Tools |
|----------|-------|
| Workflow Generation | create-automation, explain-yaml, list-templates, build-trigger, build-action |
| Deployment | verify-workflow, deploy-workflow, prepare-deploy, deactivate-workflow, workflow-status, list-workflows |
| Explorer | explorer-stats, explorer-actions, get-workflow, fetch-abi |
| Account | wallet, credit-balance, configure, login |
| System | list-chains, tools |

## As a Library

```typescript
import { createMcpServer } from "@kwala-ai/cli";

const server = createMcpServer();
// Use with any MCP transport
```

## Links

- [Documentation](https://docs.kwala-ai.xyz)
- [Web App](https://kwala-ai.xyz)
- [GitHub](https://github.com/Blockchain-Oracle/kwala-mcp)
- [Kwala Network](https://kwala.network)

## License

MIT

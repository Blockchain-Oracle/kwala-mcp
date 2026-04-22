#!/usr/bin/env node
import { Command } from "commander";
import { createMcpServer } from "./server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadOrCreateWallet, getAddress, getConfigPath } from "./lib/wallet.js";
import { CHAINS, resolveChainId, getChain } from "./lib/chains.js";
import { TOKENS, resolveToken } from "./lib/tokens.js";
import { TEMPLATES } from "./lib/templates.js";
import { kwalaGet, kwalaPost } from "./lib/api.js";
import { fetchAbi, listEvents, listFunctions } from "./lib/abi.js";
import { validateWorkflow } from "./lib/schema.js";
import { fullDeploy, extractWorkflowName } from "./lib/deployer.js";
import { logger } from "./lib/logger.js";

function output(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + "\n");
}

function fatal(msg: string): never {
  process.stderr.write(`Error: ${msg}\n`);
  process.exit(1);
}

const program = new Command()
  .name("kwala")
  .description("CLI for Kwala Network blockchain automations. 17 tools for creating, verifying, deploying, and monitoring Kwalang workflows.")
  .version("0.1.0");

// Default action: start MCP server
program.action(async () => {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
});

// ═══════════════════════════════════════════
// SYSTEM
// ═══════════════════════════════════════════

program
  .command("tools")
  .description("List all 17 available Kwala MCP tools")
  .action(() => {
    output({
      "Workflow Generation": ["create-automation", "explain-yaml", "list-templates", "build-trigger", "build-action"],
      "Deployment": ["verify-workflow", "deploy-workflow", "workflow-status", "list-workflows"],
      "Explorer": ["explorer-stats", "explorer-actions", "get-workflow", "fetch-abi"],
      "Account": ["wallet", "credit-balance"],
      "System": ["list-chains", "tools"],
    });
  });

program
  .command("list-chains")
  .description("List all supported blockchain networks")
  .option("--network <type>", "Filter: mainnet, testnet, all", "all")
  .action((opts) => {
    const chains = opts.network === "all"
      ? CHAINS
      : CHAINS.filter((c) => c.network === opts.network);
    output(chains.map((c) => ({
      ...c,
      tokens: TOKENS.filter((t) => t.addresses[c.id]).map((t) => ({
        symbol: t.symbol,
        address: t.addresses[c.id],
      })),
    })));
  });

// ═══════════════════════════════════════════
// ACCOUNT
// ═══════════════════════════════════════════

program
  .command("wallet")
  .description("Show your KWALA chain wallet address (auto-creates if needed)")
  .action(() => {
    const config = loadOrCreateWallet();
    output({
      address: config.address,
      kwala_chain: { chain_id: 1905, rpc: "https://rpc-ohio.kwala.network" },
      config_path: getConfigPath(),
    });
  });

program
  .command("credit-balance")
  .description("Check Kwala credit balance")
  .option("--address <addr>", "Wallet address (default: stored wallet)")
  .action(async (opts) => {
    const addr = opts.address ?? getAddress();
    try {
      const data = await kwalaGet(`/user/getBalance/${addr}`);
      output({ address: addr, balance: data });
    } catch (e) {
      fatal(e instanceof Error ? e.message : String(e));
    }
  });

// ═══════════════════════════════════════════
// EXPLORER
// ═══════════════════════════════════════════

program
  .command("explorer-stats")
  .description("Get Kwala network-wide statistics")
  .option("--user <addr>", "Filter by user address")
  .option("--workflow <name>", "Filter by workflow name")
  .action(async (opts) => {
    try {
      const params: Record<string, string> = {};
      if (opts.user) params.user_address = opts.user;
      if (opts.workflow) params.workflow_name = opts.workflow;
      const [actions, workflows] = await Promise.all([
        kwalaGet("/explorer/actions/count", params),
        kwalaGet("/explorer/workflows/deployed/count"),
      ]);
      output({ total_actions_executed: actions, total_workflows_deployed: workflows });
    } catch (e) {
      fatal(e instanceof Error ? e.message : String(e));
    }
  });

program
  .command("explorer-actions")
  .description("Browse recent workflow executions")
  .option("--page <n>", "Page number", "1")
  .option("--size <n>", "Page size", "10")
  .option("--user <addr>", "Filter by user address")
  .action(async (opts) => {
    try {
      const params: Record<string, string | number> = { page: opts.page, page_size: opts.size };
      if (opts.user) params.user_address = opts.user;
      const data = await kwalaGet("/explorer/actions", params);
      output(data);
    } catch (e) {
      fatal(e instanceof Error ? e.message : String(e));
    }
  });

program
  .command("get-workflow")
  .description("Fetch a deployed workflow's YAML by ID")
  .argument("<id>", "Workflow ID or name")
  .action(async (id) => {
    let fullId = id;
    if (!id.includes("_0x")) fullId = `${id}_${getAddress()}`;
    try {
      const data = await kwalaGet(`/workflow/yaml/${fullId}`);
      output({ workflow_id: fullId, yaml: data });
    } catch (e) {
      fatal(e instanceof Error ? e.message : String(e));
    }
  });

program
  .command("fetch-abi")
  .description("Fetch a contract's ABI")
  .argument("<address>", "Contract address")
  .option("--chain <chain>", "Chain name or ID", "84532")
  .action(async (address, opts) => {
    const chainId = resolveChainId(opts.chain, false) ?? Number(opts.chain);
    try {
      const abi = await fetchAbi(address, chainId);
      output({
        address,
        chain_id: chainId,
        events: listEvents(abi),
        functions: listFunctions(abi),
        abi_entries: abi.length,
      });
    } catch (e) {
      fatal(e instanceof Error ? e.message : String(e));
    }
  });

// ═══════════════════════════════════════════
// WORKFLOW GENERATION
// ═══════════════════════════════════════════

program
  .command("list-templates")
  .description("Browse pre-built workflow templates")
  .option("--category <cat>", "Filter: alerts, defi, nft, monitoring, all", "all")
  .option("--search <q>", "Search by keyword")
  .action((opts) => {
    let results = TEMPLATES;
    if (opts.category && opts.category !== "all") {
      results = results.filter((t) => t.category === opts.category);
    }
    if (opts.search) {
      const q = opts.search.toLowerCase();
      results = results.filter((t) =>
        t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    output(results.map((t) => ({ id: t.id, name: t.name, category: t.category, description: t.description })));
  });

program
  .command("explain-yaml")
  .description("Explain a workflow YAML in plain English")
  .argument("<file>", "Path to YAML file or '-' for stdin")
  .action(async (file) => {
    const fs = await import("node:fs");
    let yamlStr: string;
    if (file === "-") {
      yamlStr = fs.readFileSync(0, "utf-8");
    } else {
      yamlStr = fs.readFileSync(file, "utf-8");
    }
    // Just validate and output — the MCP tool has the full explain logic
    const result = validateWorkflow(yamlStr);
    output({ valid: result.valid, errors: result.errors, yaml_preview: yamlStr.slice(0, 500) });
  });

// ═══════════════════════════════════════════
// DEPLOYMENT
// ═══════════════════════════════════════════

program
  .command("verify-workflow")
  .description("Verify a YAML workflow against Kwala's backend")
  .argument("<file>", "Path to YAML file")
  .action(async (file) => {
    const fs = await import("node:fs");
    const yaml = fs.readFileSync(file, "utf-8");
    const local = validateWorkflow(yaml);
    if (!local.valid) {
      fatal(`Local validation failed: ${local.errors?.join("; ")}`);
    }
    try {
      const result = await kwalaPost("/workflow/verify", {
        yaml,
        user_address: getAddress(),
      });
      output(result);
    } catch (e) {
      fatal(e instanceof Error ? e.message : String(e));
    }
  });

program
  .command("deploy-workflow")
  .description("Deploy a workflow end-to-end on KWALA chain")
  .argument("<file>", "Path to YAML file")
  .option("--no-activate", "Don't activate after deploying")
  .action(async (file, opts) => {
    const fs = await import("node:fs");
    const yaml = fs.readFileSync(file, "utf-8");
    process.stderr.write(`Deploying ${extractWorkflowName(yaml)}...\n`);
    try {
      const result = await fullDeploy(yaml, { autoActivate: opts.activate !== false });
      output(result);
    } catch (e) {
      fatal(e instanceof Error ? e.message : String(e));
    }
  });

program
  .command("workflow-status")
  .description("Check workflow deployment and execution status")
  .argument("<id>", "Workflow ID or name")
  .action(async (id) => {
    let fullId = id;
    if (!id.includes("_0x")) fullId = `${id}_${getAddress()}`;
    try {
      const [status, chaincode] = await Promise.allSettled([
        kwalaGet(`/workflow/${fullId}/status`),
        kwalaGet(`/workflow/chaincode/${fullId}`),
      ]);
      output({
        workflow_id: fullId,
        status: status.status === "fulfilled" ? status.value : null,
        chaincode: chaincode.status === "fulfilled" ? chaincode.value : null,
      });
    } catch (e) {
      fatal(e instanceof Error ? e.message : String(e));
    }
  });

program
  .command("list-workflows")
  .description("List workflows deployed by your wallet")
  .option("--address <addr>", "Wallet address (default: stored wallet)")
  .option("--page <n>", "Page number", "1")
  .option("--size <n>", "Page size", "10")
  .action(async (opts) => {
    const addr = opts.address ?? getAddress();
    try {
      const data = await kwalaGet(`/workflow/deployer/${addr}`, {
        page: opts.page,
        page_size: opts.size,
      });
      output({ address: addr, workflows: data });
    } catch (e) {
      fatal(e instanceof Error ? e.message : String(e));
    }
  });

program.parse();

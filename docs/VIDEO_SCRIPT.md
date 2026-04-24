# Kwala AI — Demo Video Script

**Track:** Finance
**Max runtime:** 4 minutes

---

## THE GAP (0:00–0:30)

*Screen: Kwala Network site or dashboard*

> What's good, I'm Abu. So let's talk about what's missing in the Kwala ecosystem right now.

> Every major protocol out there — Stacks, Base, you name it — they already have AI tooling. Agents that can interact with their chain, build on it, automate stuff. Kwala? Nothing. No AI tools, no agent integration, no way to programmatically interact with the network without doing everything manually.

> So we built one. The first one. **Kwala AI**.

---

## WHAT WE BUILT (0:30–0:55)

*Screen: Kwala AI chat interface*

> This is the first programmatic AI tool for the Kwala Network. You talk to it — plain English — and it handles everything. It builds your workflow, validates it, deploys it on-chain, activates it, sets up your notifications. You don't touch a config file, you don't write a single line of YAML, you don't manage any infrastructure.

> 20 tools. 11 supported chains. Everything happens through one conversation.

---

## LIVE DEMO (0:55–2:30)

*Connect wallet*

> Let me show you what that actually looks like. Wallet's connected.

*Type: "Show my wallet and balance"*

*Cards appear — address, GINI balance, credits*

> There's my wallet, my GINI balance on the Kwala chain, credits — done.

*Type: "List all supported chains"*

*Chain cards appear*

> Ethereum, Base, Polygon, BNB Chain, Avalanche, Celo — mainnets and testnets. 11 chains ready to go.

---

*Type: "Monitor USDC transfers above 1 USDC on Base Sepolia and alert me on Telegram with the sender, receiver, and amount"*

> I want to monitor USDC transfers on Base Sepolia — anything above 1 USDC, hit my Telegram with who sent it, who received it, and how much.

*AI generates the workflow — AutomationCard with YAML, trigger, chain*

> It picked Base Sepolia, resolved the USDC contract address, set up the Transfer event trigger with the filter, and wrote the notification message with the actual on-chain data — sender, receiver, amount. One sentence from me.

*Click "Deploy This Workflow" — MetaMask pops up*

> Now I deploy. Two transactions — save and deploy — signed with my wallet. No private keys stored anywhere.

*Sign both, success*

> On-chain. Real transaction hashes.

---

**Trigger the notification live:**

*Open MetaMask or another wallet tab, send 2 USDC to any address on Base Sepolia*

> Now let me trigger this live. I'm sending 2 USDC on Base Sepolia right now.

*Transaction confirms, wait a few seconds, Telegram notification pops up on phone*

> There it is. My phone just got the alert — sender address, receiver, amount. That whole thing, from "I want to monitor transfers" to a real notification on my phone, took about a minute.

*Type: "Show me the explorer stats"*

*ExplorerStatsCard*

> And you can see it on the Kwala explorer — live execution, real workflow running on-chain.

---

## FINANCE TRACK (2:30–3:05)

> So why the finance track — what I just did in under a minute, that same workflow pattern is how you build real financial automation.

> Payment settlement — stablecoin hits a contract, workflow settles it instantly. Portfolio rebalancing — price crosses a threshold, workflow executes. Compliance — track wallets across chains, flag suspicious activity, full audit trail. Cross-border remittance with stablecoin hedging.

> Before Kwala AI, you'd need a dev team to wire all of that up. Now you just tell the chatbot what you need.

---

## WORKS EVERYWHERE (3:05–3:30)

*Screen: Terminal*

> And this isn't locked to the web app. Kwala AI is an MCP server — one command and it works in Claude Code, Cursor, Windsurf, Gemini CLI, any MCP client.

```
claude mcp add kwala npx @kwala-ai/mcp
```

> There's also a standalone CLI. Both packages are live on npm right now — `@kwala-ai/cli` and `@kwala-ai/mcp`.

---

## CLOSE (3:30–3:50)

*Screen: Chat interface or landing page*

> Before today, there was no AI tooling for Kwala. No way to programmatically build and deploy workflows without doing it all by hand.

> Now there is. 20 tools, 11 chains, wallet signing, on-chain deployment, notifications — all from a conversation.

> kwala-ai.xyz. GitHub — Blockchain-Oracle/kwala-mcp.

> Appreciate you watching.

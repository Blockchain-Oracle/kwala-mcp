import { NextResponse } from "next/server";

const KWALA_API = process.env.KWALA_API_URL ?? "https://kwala-test.kalp.network";
const KWALA_RPC = "https://rpc-ohio.kwala.network";
const CONTRACT = "0x3e0c606d0ce3f0dec6c569a586a59128a1d9613e";
const GAS_PRICE = "0x3B9ACA00"; // 1 gwei
const GAS_LIMIT = "0x7A120"; // 500000

async function rpcCall(method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(KWALA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  });
  const json = (await res.json()) as { result?: unknown; error?: { message: string } };
  if (json.error) throw new Error(`RPC: ${json.error.message}`);
  return json.result;
}

export async function POST(request: Request) {
  try {
    const { yaml, user_address } = (await request.json()) as {
      yaml: string;
      user_address: string;
    };

    if (!yaml || !user_address) {
      return NextResponse.json({ error: "yaml and user_address required" }, { status: 400 });
    }

    // Verify first
    const verifyRes = await fetch(`${KWALA_API}/workflow/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ yaml, user_address }),
    });
    const verify = (await verifyRes.json()) as { syntax_check: boolean; schema_validation: boolean; error?: string };

    if (!verify.syntax_check || !verify.schema_validation) {
      return NextResponse.json({ error: `Verification failed: ${verify.error ?? "Invalid YAML"}` }, { status: 400 });
    }

    // Import ethers dynamically to encode calldata
    const { Interface, Wallet, Transaction } = await import("ethers");

    // Use the CLI wallet for signing (stored in ~/.kwala-mcp/config.json)
    const fs = await import("fs");
    const os = await import("os");
    const path = await import("path");
    const configPath = path.join(os.homedir(), ".kwala-mcp", "config.json");

    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ error: "No wallet configured. Run the CLI first to generate a wallet." }, { status: 400 });
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const wallet = new Wallet(config.privateKey);

    // Mutate YAML name
    const YAML = await import("yaml");
    const parsed = YAML.parse(yaml) as Record<string, unknown>;
    const workflowName = parsed.Name as string;
    parsed.Name = `${workflowName}_${wallet.address}`;
    const mutatedYaml = YAML.stringify(parsed);
    const workflowId = `${workflowName}_${wallet.address}`;

    const iface = new Interface([
      "function saveWorkflow(string yaml)",
      "function deployWorkflow(string calldata yaml)",
      "function triggerWorkflow(address chaincodeAddress)",
    ]);

    const steps: Array<{ name: string; status: string; tx_hash?: string; error?: string }> = [];

    // Step 1: Save
    try {
      const data = iface.encodeFunctionData("saveWorkflow", [mutatedYaml]);
      const tx = Transaction.from({
        to: CONTRACT, data, nonce: 0,
        gasPrice: BigInt("1000000000"), gasLimit: BigInt("500000"),
        chainId: 1905, type: 0, value: 0,
      });
      const signed = await wallet.signTransaction(tx);
      const result = await rpcCall("eth_sendRawTransaction", [signed]);
      const hash = typeof result === "object" && result !== null
        ? ((result as Record<string, unknown>).txHash as string) : String(result);
      steps.push({ name: "save", status: "ok", tx_hash: hash });
    } catch (e) {
      steps.push({ name: "save", status: "failed", error: e instanceof Error ? e.message : String(e) });
      return NextResponse.json({ deployed: false, workflow_id: workflowId, steps, error: "Save failed" });
    }

    // Step 2: Deploy
    try {
      const data = iface.encodeFunctionData("deployWorkflow", [mutatedYaml]);
      const tx = Transaction.from({
        to: CONTRACT, data, nonce: 0,
        gasPrice: BigInt("1000000000"), gasLimit: BigInt("500000"),
        chainId: 1905, type: 0, value: 0,
      });
      const signed = await wallet.signTransaction(tx);
      const result = await rpcCall("eth_sendRawTransaction", [signed]);
      const hash = typeof result === "object" && result !== null
        ? ((result as Record<string, unknown>).txHash as string) : String(result);
      steps.push({ name: "deploy", status: "ok", tx_hash: hash });
    } catch (e) {
      steps.push({ name: "deploy", status: "failed", error: e instanceof Error ? e.message : String(e) });
      return NextResponse.json({ deployed: false, workflow_id: workflowId, steps, error: "Deploy failed" });
    }

    // Step 3: Get chaincode
    let chaincodeAddress: string | undefined;
    for (let attempt = 0; attempt < 20; attempt++) {
      try {
        const res = await fetch(`${KWALA_API}/workflow/chaincode/${workflowId}`);
        const data = (await res.json()) as { chaincode_address?: string };
        if (data.chaincode_address) {
          chaincodeAddress = data.chaincode_address.startsWith("0x")
            ? data.chaincode_address : `0x${data.chaincode_address}`;
          break;
        }
      } catch { /* retry */ }
      await new Promise((r) => setTimeout(r, 3000));
    }

    if (chaincodeAddress) {
      steps.push({ name: "get_chaincode", status: "ok" });

      // Step 4: Wait for CLAIMED then activate
      for (let attempt = 0; attempt < 20; attempt++) {
        try {
          const res = await fetch(`${KWALA_API}/workflow/${workflowId}/status`);
          const s = (await res.json()) as { status: string };
          if (s.status === "CLAIMED") {
            const data = iface.encodeFunctionData("triggerWorkflow", [chaincodeAddress]);
            const tx = Transaction.from({
              to: CONTRACT, data, nonce: 0,
              gasPrice: BigInt("1000000000"), gasLimit: BigInt("500000"),
              chainId: 1905, type: 0, value: 0,
            });
            const signed = await wallet.signTransaction(tx);
            await rpcCall("eth_sendRawTransaction", [signed]);
            steps.push({ name: "activate", status: "ok" });
            break;
          }
        } catch { /* retry */ }
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    return NextResponse.json({
      deployed: true,
      workflow_id: workflowId,
      workflow_name: workflowName,
      chaincode_address: chaincodeAddress,
      steps,
      explorer: {
        workflow: `https://kwala-explorer.lovable.app/workflow/${workflowId}`,
      },
    });
  } catch (e) {
    console.error("[Deploy API] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Deployment failed" },
      { status: 500 }
    );
  }
}

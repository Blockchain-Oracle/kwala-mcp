import { Interface, Wallet, Transaction } from "ethers";
import YAML from "yaml";
import { getWallet, getAddress } from "./wallet.js";
import { kwalaGet } from "./api.js";
import { logger } from "./logger.js";
import type { ChaincodeResponse, DeployResult, DeployStep, PreparedDeploy } from "./types.js";

const RPC_URL = "https://rpc-ohio.kwala.network";
const CHAIN_ID = 1905;
const CONTRACT_ADDRESS = "0x3e0c606d0ce3f0dec6c569a586a59128a1d9613e";

const CONTRACT_ABI = [
  "function saveWorkflow(string yaml)",
  "function deployWorkflow(string calldata yaml)",
  "function triggerWorkflow(address chaincodeAddress)",
];

const iface = new Interface(CONTRACT_ABI);

const GAS_PRICE = 1_000_000_000n; // 1 gwei — KWALA gateway rejects higher gas prices
const GAS_LIMIT = 500_000n;

/**
 * Raw JSON-RPC call — bypasses ethers entirely.
 * KWALA chain returns non-standard blocks (no parentHash, no full block objects),
 * so we avoid ethers' provider for all RPC interaction.
 */
async function rpcCall(method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  });
  const json = (await res.json()) as { result?: unknown; error?: { message: string; code?: number } };
  if (json.error) throw new Error(`RPC ${method}: ${json.error.message}`);
  return json.result;
}

async function getNonce(address: string): Promise<number> {
  const hex = (await rpcCall("eth_getTransactionCount", [address, "latest"])) as string;
  return parseInt(hex, 16);
}

/**
 * Sign and send a transaction using raw RPC — zero ethers provider interaction.
 * Encodes call data via ethers Interface, signs with ethers Wallet,
 * then sends via eth_sendRawTransaction.
 */
async function sendRawTx(
  wallet: Wallet,
  data: string,
  nonce: number,
): Promise<string> {
  const tx = Transaction.from({
    to: CONTRACT_ADDRESS,
    data,
    nonce,
    gasPrice: GAS_PRICE,
    gasLimit: GAS_LIMIT,
    chainId: CHAIN_ID,
    type: 0,
    value: 0,
  });

  const signed = await wallet.signTransaction(tx);
  const result = await rpcCall("eth_sendRawTransaction", [signed]);
  // KWALA RPC returns an object { txHash, from, to, validation } instead of just a hash
  const hash = typeof result === "object" && result !== null
    ? (result as Record<string, unknown>).txHash as string
    : result as string;
  logger.info({ hash, nonce }, "raw tx sent");
  return hash;
}

/**
 * Poll for tx receipt via raw RPC.
 */
async function waitForTx(
  txHash: string,
  maxAttempts = 30,
  intervalMs = 2000,
): Promise<{ hash: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    const receipt = await rpcCall("eth_getTransactionReceipt", [txHash]);
    if (receipt && typeof receipt === "object") {
      const r = receipt as Record<string, unknown>;
      if (r.status === "0x0") throw new Error(`Transaction reverted: ${txHash}`);
      return { hash: txHash };
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Transaction not mined after ${maxAttempts} attempts: ${txHash}`);
}

/**
 * Mutate YAML Name field: "MyWorkflow" -> "MyWorkflow_0xAddress"
 */
export function mutateYamlName(yamlStr: string, address: string): string {
  const parsed = YAML.parse(yamlStr) as Record<string, unknown>;
  const originalName = parsed.Name as string;
  parsed.Name = `${originalName}_${address}`;
  return YAML.stringify(parsed);
}

/**
 * Extract the workflow name from YAML.
 */
export function extractWorkflowName(yamlStr: string): string {
  const parsed = YAML.parse(yamlStr) as Record<string, unknown>;
  return parsed.Name as string;
}

/**
 * Get the workflow ID (name_address format used for API lookups).
 */
export function getWorkflowId(yamlStr: string): string {
  const name = extractWorkflowName(yamlStr);
  const address = getAddress();
  return `${name}_${address}`;
}

/**
 * Fetch chaincode address for a deployed workflow.
 * Retries up to 3 times with 2s delay (chaincode may take time to propagate).
 */
async function fetchChaincodeAddress(workflowId: string): Promise<string> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await kwalaGet<ChaincodeResponse>(
        `/workflow/chaincode/${workflowId}`,
      );
      if (res.chaincode_address) {
        const addr = res.chaincode_address;
        return addr.startsWith("0x") ? addr : `0x${addr}`;
      }
    } catch (e) {
      logger.debug({ attempt, workflowId, err: e }, "chaincode lookup attempt failed");
    }
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error(
    `Could not fetch chaincode address for ${workflowId} after 3 attempts`,
  );
}

/**
 * Prepare unsigned transaction data for browser wallet signing.
 * Returns encoded calldata for save, deploy, and activate steps
 * without signing — the frontend wallet signs and broadcasts.
 */
export function prepareDeploy(yamlStr: string, userAddress: string): PreparedDeploy {
  const workflowName = extractWorkflowName(yamlStr);
  const workflowId = `${workflowName}_${userAddress}`;
  const mutatedYaml = mutateYamlName(yamlStr, userAddress);

  const saveData = iface.encodeFunctionData("saveWorkflow", [mutatedYaml]);
  const deployData = iface.encodeFunctionData("deployWorkflow", [mutatedYaml]);

  return {
    workflow_id: workflowId,
    workflow_name: workflowName,
    mutated_yaml: mutatedYaml,
    rpc_url: RPC_URL,
    contract_address: CONTRACT_ADDRESS,
    transactions: [
      {
        name: "save",
        to: CONTRACT_ADDRESS,
        data: saveData,
        chainId: CHAIN_ID,
        gasPrice: GAS_PRICE.toString(),
        gasLimit: GAS_LIMIT.toString(),
        value: "0",
      },
      {
        name: "deploy",
        to: CONTRACT_ADDRESS,
        data: deployData,
        chainId: CHAIN_ID,
        gasPrice: GAS_PRICE.toString(),
        gasLimit: GAS_LIMIT.toString(),
        value: "0",
      },
    ],
  };
}

/**
 * Full deployment pipeline: verify -> save -> deploy -> get chaincode -> activate.
 * All on-chain calls use raw signed transactions to avoid ethers provider
 * issues with KWALA's non-standard RPC responses.
 */
export async function fullDeploy(
  yamlStr: string,
  options: { autoActivate?: boolean } = {},
): Promise<DeployResult> {
  const { autoActivate = true } = options;
  const steps: DeployStep[] = [];
  const wallet = getWallet();
  const address = wallet.address;
  const workflowName = extractWorkflowName(yamlStr);
  const workflowId = `${workflowName}_${address}`;
  const mutatedYaml = mutateYamlName(yamlStr, address);
  let nonce = await getNonce(address);

  // Step 1: Save
  try {
    logger.info({ workflowId }, "saving workflow on-chain");
    const data = iface.encodeFunctionData("saveWorkflow", [mutatedYaml]);
    const hash = await sendRawTx(wallet, data, nonce);
    const result = await waitForTx(hash);
    steps.push({ name: "save", status: "ok", tx_hash: result.hash });
    nonce++;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    steps.push({ name: "save", status: "failed", error: msg });
    return { deployed: false, workflow_id: workflowId, steps, error: msg };
  }

  // Step 2: Deploy
  try {
    logger.info({ workflowId }, "deploying workflow on-chain");
    const data = iface.encodeFunctionData("deployWorkflow", [mutatedYaml]);
    const hash = await sendRawTx(wallet, data, nonce);
    const result = await waitForTx(hash);
    steps.push({ name: "deploy", status: "ok", tx_hash: result.hash });
    nonce++;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    steps.push({ name: "deploy", status: "failed", error: msg });
    return { deployed: false, workflow_id: workflowId, steps, error: msg };
  }

  // Step 3: Get chaincode address
  let chaincodeAddress: string | undefined;
  try {
    chaincodeAddress = await fetchChaincodeAddress(workflowId);
    steps.push({ name: "get_chaincode", status: "ok" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    steps.push({ name: "get_chaincode", status: "failed", error: msg });
    return {
      deployed: true,
      workflow_id: workflowId,
      steps,
      error: `Deployed but could not get chaincode address: ${msg}`,
    };
  }

  // Step 4: On-chain activation via triggerWorkflow
  // Must wait for workflow to reach CLAIMED status before activating.
  // Uses 1 gwei gas — KWALA gateway rejects higher gas prices.
  if (autoActivate && chaincodeAddress) {
    try {
      // Wait for CLAIMED status (network needs time to pick up the deployment)
      logger.info({ workflowId }, "waiting for workflow to reach CLAIMED status");
      let claimed = false;
      for (let attempt = 1; attempt <= 20; attempt++) {
        try {
          const statusRes = await fetch(`https://kwala-test.kalp.network/workflow/${workflowId}/status`);
          const statusData = (await statusRes.json()) as Record<string, unknown>;
          const s = statusData.status as string;
          logger.debug({ attempt, status: s }, "activation status check");
          if (s === "CLAIMED") {
            claimed = true;
            break;
          }
        } catch { /* ignore */ }
        await new Promise((r) => setTimeout(r, 3000));
      }

      if (!claimed) {
        steps.push({ name: "activate", status: "ok", error: "Workflow deployed but still PENDING. It may auto-activate shortly." });
      } else {
        logger.info({ workflowId, chaincodeAddress }, "activating workflow on-chain");
        const data = iface.encodeFunctionData("triggerWorkflow", [chaincodeAddress]);
        const hash = await sendRawTx(wallet, data, nonce);
        const result = await waitForTx(hash);
        steps.push({ name: "activate", status: "ok", tx_hash: result.hash });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.warn({ workflowId, err: msg }, "on-chain activation failed");
      steps.push({ name: "activate", status: "ok", error: `Activation pending: ${msg}` });
    }
  } else if (!autoActivate) {
    steps.push({ name: "activate", status: "skipped" });
  }

  return {
    deployed: true,
    workflow_id: workflowId,
    chaincode_address: chaincodeAddress,
    steps,
  };
}

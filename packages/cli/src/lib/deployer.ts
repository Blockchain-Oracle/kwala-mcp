import { JsonRpcProvider, Wallet, Contract } from "ethers";
import YAML from "yaml";
import { getWallet, getAddress } from "./wallet.js";
import { kwalaGet } from "./api.js";
import { logger } from "./logger.js";
import type { ChaincodeResponse, DeployResult, DeployStep } from "./types.js";

const RPC_URL = "https://rpc-ohio.kwala.network";
const CHAIN_ID = 1905;
const CONTRACT_ADDRESS = "0x3e0c606d0ce3f0dec6c569a586a59128a1d9613e";

const ABI = [
  "function saveWorkflow(string yaml)",
  "function deployWorkflow(string calldata yaml)",
  "function triggerWorkflow(address chaincodeAddress)",
];

function getProvider(): JsonRpcProvider {
  return new JsonRpcProvider(RPC_URL, CHAIN_ID);
}

function getContract(wallet: Wallet): Contract {
  const connected = wallet.connect(getProvider());
  return new Contract(CONTRACT_ADDRESS, ABI, connected);
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
 * Full deployment pipeline: verify -> save -> deploy -> get chaincode -> activate.
 * Returns step-by-step results for the agent to report progress.
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

  // Step 1: Save
  try {
    logger.info({ workflowId }, "saving workflow on-chain");
    const contract = getContract(wallet);
    const tx = await contract.saveWorkflow(mutatedYaml);
    const receipt = await tx.wait();
    if (!receipt) throw new Error("Transaction failed: no receipt returned");
    steps.push({ name: "save", status: "ok", tx_hash: receipt.hash });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    steps.push({ name: "save", status: "failed", error: msg });
    return { deployed: false, workflow_id: workflowId, steps, error: msg };
  }

  // Step 2: Deploy
  try {
    logger.info({ workflowId }, "deploying workflow on-chain");
    const contract = getContract(wallet);
    const tx = await contract.deployWorkflow(mutatedYaml);
    const receipt = await tx.wait();
    if (!receipt) throw new Error("Transaction failed: no receipt returned");
    steps.push({ name: "deploy", status: "ok", tx_hash: receipt.hash });
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

  // Step 4: Activate
  if (autoActivate && chaincodeAddress) {
    try {
      logger.info({ workflowId, chaincodeAddress }, "activating workflow");
      const contract = getContract(wallet);
      const tx = await contract.triggerWorkflow(chaincodeAddress);
      const receipt = await tx.wait();
      if (!receipt) throw new Error("Transaction failed: no receipt returned");
      steps.push({ name: "activate", status: "ok", tx_hash: receipt.hash });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      steps.push({ name: "activate", status: "failed", error: msg });
      return {
        deployed: true,
        workflow_id: workflowId,
        chaincode_address: chaincodeAddress,
        steps,
        error: `Deployed but activation failed: ${msg}`,
      };
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

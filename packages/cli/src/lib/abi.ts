import { kwalaGet } from "./api.js";
import { logger } from "./logger.js";

// In-memory ABI cache (persists for server lifetime)
const abiCache = new Map<string, unknown[]>();

/**
 * Fetch a contract's ABI from Kwala's API and cache it.
 * Returns the parsed ABI as a JSON array.
 */
export async function fetchAbi(
  address: string,
  chainId: number,
): Promise<unknown[]> {
  const cacheKey = `${chainId}:${address.toLowerCase()}`;
  const cached = abiCache.get(cacheKey);
  if (cached) return cached;

  const result = await kwalaGet<unknown>(
    "/contract/fetchABI",
    { chain_id: String(chainId), chaincode_address: address },
  );

  // The API may return the ABI directly as an array or wrapped in an object
  const abi = Array.isArray(result)
    ? result
    : Array.isArray((result as Record<string, unknown>)?.abi)
      ? (result as Record<string, unknown>).abi as unknown[]
      : [];

  if (abi.length > 0) {
    abiCache.set(cacheKey, abi);
  }

  return abi;
}

/**
 * Fetch ABI and return as base64-encoded string (for Kwalang YAML).
 * The agent never sees this — tools call it internally.
 */
export async function fetchAbiBase64(
  address: string,
  chainId: number,
): Promise<string> {
  const abi = await fetchAbi(address, chainId);
  return Buffer.from(JSON.stringify(abi)).toString("base64");
}

/**
 * Given an ABI and a short event name (e.g., "Transfer"),
 * resolve to the full Solidity event signature (e.g., "Transfer(address,address,uint256)").
 */
export function resolveEventSignature(
  abi: unknown[],
  eventName: string,
): string | undefined {
  for (const item of abi) {
    const entry = item as Record<string, unknown>;
    if (entry.type !== "event") continue;
    if (entry.name !== eventName) continue;

    const inputs = entry.inputs as Array<{ type: string }> | undefined;
    if (!inputs) return `${eventName}()`;

    const paramTypes = inputs.map((i) => i.type).join(",");
    return `${eventName}(${paramTypes})`;
  }
  return undefined;
}

/**
 * Given an ABI and a short function name (e.g., "transfer"),
 * resolve to the full function signature (e.g., "function transfer(address to, uint256 amount)").
 */
export function resolveFunctionSignature(
  abi: unknown[],
  funcName: string,
): string | undefined {
  for (const item of abi) {
    const entry = item as Record<string, unknown>;
    if (entry.type !== "function") continue;
    if (entry.name !== funcName) continue;

    const inputs = entry.inputs as Array<{ type: string; name: string }> | undefined;
    if (!inputs) return `function ${funcName}()`;

    const params = inputs.map((i) => `${i.type} ${i.name}`).join(", ");
    return `function ${funcName}(${params})`;
  }
  return undefined;
}

/**
 * List all events in an ABI.
 */
export function listEvents(
  abi: unknown[],
): Array<{ name: string; signature: string }> {
  const events: Array<{ name: string; signature: string }> = [];
  for (const item of abi) {
    const entry = item as Record<string, unknown>;
    if (entry.type !== "event") continue;
    const name = entry.name as string;
    const sig = resolveEventSignature(abi, name);
    if (sig) events.push({ name, signature: sig });
  }
  return events;
}

/**
 * List all functions in an ABI.
 */
export function listFunctions(
  abi: unknown[],
): Array<{ name: string; signature: string }> {
  const fns: Array<{ name: string; signature: string }> = [];
  for (const item of abi) {
    const entry = item as Record<string, unknown>;
    if (entry.type !== "function") continue;
    const name = entry.name as string;
    const sig = resolveFunctionSignature(abi, name);
    if (sig) fns.push({ name, signature: sig });
  }
  return fns;
}

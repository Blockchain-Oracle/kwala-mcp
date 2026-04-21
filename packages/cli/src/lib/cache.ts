import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "./logger.js";

const TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  result: CallToolResult;
  expires: number;
}

const store = new Map<string, CacheEntry>();

export async function withCache(
  toolName: string,
  params: Record<string, unknown>,
  fn: () => Promise<CallToolResult>,
): Promise<CallToolResult> {
  const key = `${toolName}:${JSON.stringify(params)}`;

  const cached = store.get(key);
  if (cached && Date.now() < cached.expires) {
    logger.debug({ toolName }, "cache hit");
    const original = cached.result;
    if (original.content[0]?.type === "text") {
      return {
        ...original,
        content: [
          {
            type: "text" as const,
            text: `[cached]\n\n${original.content[0].text}`,
          },
        ],
      };
    }
    return original;
  }

  const result = await fn();

  if (!result.isError) {
    store.set(key, { result, expires: Date.now() + TTL_MS });
  }

  if (store.size > 50) {
    const now = Date.now();
    for (const [k, v] of store) {
      if (now >= v.expires) store.delete(k);
    }
  }

  return result;
}

export function invalidateCache(...prefixes: string[]): void {
  if (prefixes.length === 0) return;
  for (const key of store.keys()) {
    if (prefixes.some((p) => key.startsWith(p))) {
      store.delete(key);
    }
  }
}

export function invalidateCacheAll(): void {
  store.clear();
}

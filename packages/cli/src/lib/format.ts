import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export function ok(data: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    isError: false,
  };
}

export function err(
  message: string,
  extra?: { suggestion?: string; missing_params?: string[]; retry_safe?: boolean },
): CallToolResult {
  const body: Record<string, unknown> = { error: message };
  if (extra?.suggestion) body.suggestion = extra.suggestion;
  if (extra?.missing_params) body.missing_params = extra.missing_params;
  if (extra?.retry_safe !== undefined) body.retry_safe = extra.retry_safe;

  return {
    content: [{ type: "text", text: JSON.stringify(body, null, 2) }],
    isError: true,
  };
}

/**
 * Kwala backend requires ALL trigger and action fields to be present,
 * even when they're not relevant. This module provides the mandatory defaults.
 * Discovered through manual testing against the /workflow/verify endpoint.
 */

/**
 * Default trigger fields the backend always requires.
 * These are merged into every trigger config.
 */
export function triggerDefaults(chainId: number): Record<string, unknown> {
  return {
    TriggerSourceContract: "0x0000000000000000000000000000000000000000",
    TriggerChainID: chainId,
    TriggerSourceContractABI: "W10=", // base64 of "[]"
    TriggerEventName: "Transfer(address,address,uint256)",
    TriggerEventFilter: "NA",
    RecurringSourceContract: "0x0000000000000000000000000000000000000000",
    RecurringChainID: chainId,
    RecurringSourceContractABI: "W10=",
    RecurringEventName: "Transfer(address,address,uint256)",
    RecurringEventFilter: "NA",
    ActionStatusNotificationPOSTURL: "NA",
    ActionStatusNotificationAPIKey: "NA",
    Meta: "NA",
  };
}

/**
 * Default action fields the backend always requires on every action,
 * even for "post" type actions.
 */
export function actionDefaults(chainId: number): Record<string, unknown> {
  return {
    ChainID: chainId,
    TargetContract: "NA",
    TargetFunction: "NA",
    TargetParams: [],
    EncodedABI: "NA",
    Metadata: "NA",
  };
}

/**
 * Convert ExpiresIn from a duration (seconds) to a future Unix timestamp
 * if it looks like a duration rather than a timestamp.
 */
export function normalizeExpiresIn(value: string | number | undefined): number | undefined {
  if (value === undefined) return undefined;
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return undefined;
  if (num < 1_000_000_000) {
    return Math.floor(Date.now() / 1000) + num;
  }
  return num;
}

/**
 * Convert seconds to the interval format Kwala backend expects.
 * Backend accepts "Nh" or "Nm" — does NOT support seconds or cron.
 * Minimum granularity is 1 minute.
 */
export function normalizeInterval(seconds: number): string {
  // Minimum 60 seconds (1 minute)
  const secs = Math.max(seconds, 60);
  if (secs >= 3600 && secs % 3600 === 0) return `${secs / 3600}h`;
  return `${Math.ceil(secs / 60)}m`;
}

/**
 * Convert a cron expression to an interval string.
 * Kwala backend doesn't support cron — we approximate with intervals.
 * Common patterns:
 *   "0 9 * * *" (daily 9am) -> "24h"
 *   "0 * /6 * * *" (every 6 hours) -> "6h"
 *   "* /30 * * * *" (every 30 min) -> "30m"
 */
export function cronToInterval(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  // Every N minutes: "* /N * * * *"
  if (parts[0]?.startsWith("*/")) {
    const mins = parseInt(parts[0].slice(2), 10);
    if (!Number.isNaN(mins)) return normalizeInterval(mins * 60);
  }
  // Every N hours: "0 * /N * * *"
  if (parts.length >= 2 && parts[1]?.startsWith("*/")) {
    const hrs = parseInt(parts[1].slice(2), 10);
    if (!Number.isNaN(hrs)) return `${hrs}h`;
  }
  // Daily at specific hour: "0 N * * *"
  if (parts.length >= 2 && !parts[1]?.includes("*") && !parts[1]?.includes("/")) {
    return "24h";
  }
  // Fallback: daily
  return "24h";
}

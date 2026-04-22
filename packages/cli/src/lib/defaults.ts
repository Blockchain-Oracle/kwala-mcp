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
    TriggerEventName: "NA",
    TriggerEventFilter: "NA",
    RecurringSourceContract: "0x0000000000000000000000000000000000000000",
    RecurringChainID: chainId,
    RecurringSourceContractABI: "W10=",
    RecurringEventName: "NA",
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
  // If it looks like a duration (< year 2000 in seconds = ~63 billion),
  // treat it as seconds from now
  if (num < 1_000_000_000) {
    return Math.floor(Date.now() / 1000) + num;
  }
  return num;
}

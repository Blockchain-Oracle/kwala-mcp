const STORAGE_KEY = "kwala_notifications";

export interface NotificationConfig {
  telegram?: { bot_token: string; chat_id: string };
  discord?: { webhook_url: string };
}

export function getNotificationConfig(): NotificationConfig {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as NotificationConfig) : {};
  } catch {
    return {};
  }
}

export function saveNotificationConfig(config: NotificationConfig): void {
  if (typeof window === "undefined") return;
  const existing = getNotificationConfig();
  const merged = {
    ...existing,
    ...config,
    telegram: config.telegram ?? existing.telegram,
    discord: config.discord ?? existing.discord,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

export function hasTelegramConfig(): boolean {
  const config = getNotificationConfig();
  return Boolean(config.telegram?.bot_token && config.telegram?.chat_id);
}

export function hasDiscordConfig(): boolean {
  const config = getNotificationConfig();
  return Boolean(config.discord?.webhook_url);
}

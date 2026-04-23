import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { Wallet } from "ethers";
import { logger } from "./logger.js";
import type { KwalaConfig } from "./types.js";

const CONFIG_DIR = join(homedir(), ".kwala-mcp");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

export function loadOrCreateWallet(): KwalaConfig {
  // Env override
  const envKey = process.env.KWALA_PRIVATE_KEY;
  if (envKey) {
    try {
      const wallet = new Wallet(envKey);
      return {
        privateKey: wallet.privateKey,
        address: wallet.address,
        createdAt: new Date().toISOString(),
      };
    } catch {
      throw new Error("KWALA_PRIVATE_KEY env var contains an invalid private key.");
    }
  }

  if (existsSync(CONFIG_PATH)) {
    try {
      const raw = readFileSync(CONFIG_PATH, "utf-8");
      const config = JSON.parse(raw) as KwalaConfig;
      if (!config.privateKey || !config.address) {
        throw new Error("missing fields");
      }
      // Validate the key is usable
      new Wallet(config.privateKey);
      return config;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.warn({ err: msg }, "wallet config corrupted, regenerating");
      // Fall through to generate new wallet
    }
  }

  // Generate new wallet
  const wallet = Wallet.createRandom();
  const config: KwalaConfig = {
    privateKey: wallet.privateKey,
    address: wallet.address,
    createdAt: new Date().toISOString(),
  };

  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });

  // First-run banner
  process.stderr.write(`
╔══════════════════════════════════════════════════════════╗
║  Kwala AI — First Run Setup                             ║
╠══════════════════════════════════════════════════════════╣
║  New wallet generated for KWALA chain (1905)             ║
║                                                          ║
║  Address: ${wallet.address}  ║
║  Config:  ${CONFIG_PATH.padEnd(44)}║
║                                                          ║
║  To deploy workflows, fund this address with native      ║
║  tokens on KWALA chain (1905).                           ║
║  RPC: https://rpc-ohio.kwala.network                     ║
╚══════════════════════════════════════════════════════════╝
`);

  logger.info({ address: wallet.address }, "New KWALA wallet generated");
  return config;
}

export function getWallet(): Wallet {
  const config = loadOrCreateWallet();
  return new Wallet(config.privateKey);
}

export function getAddress(): string {
  return loadOrCreateWallet().address;
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}

/**
 * Get the full config (including notifications, default_chain).
 */
export function getConfig(): KwalaConfig {
  return loadOrCreateWallet();
}

/**
 * Update config fields without touching the private key.
 * Merges the update into existing config.
 */
export function updateConfig(update: Partial<Omit<KwalaConfig, "privateKey" | "address" | "createdAt">>): KwalaConfig {
  const config = loadOrCreateWallet();
  const merged = { ...config, ...update };

  // Merge notifications deeply
  if (update.notifications) {
    merged.notifications = {
      ...config.notifications,
      ...update.notifications,
    };
  }

  writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), { mode: 0o600 });
  logger.info("config updated");
  return merged;
}

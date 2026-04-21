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
    const wallet = new Wallet(envKey);
    return {
      privateKey: wallet.privateKey,
      address: wallet.address,
      createdAt: new Date().toISOString(),
    };
  }

  if (existsSync(CONFIG_PATH)) {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8")) as KwalaConfig;
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
║  kwala-mcp — First Run Setup                             ║
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

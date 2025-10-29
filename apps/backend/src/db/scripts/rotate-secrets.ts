/**
 * Secrets Rotation Script (I-12)
 *
 * Rotates JWT signing keys and stores them in Vault.
 * Per ADR-002, quarterly key rotation with 24h overlap window.
 *
 * Usage:
 *   pnpm tsx apps/backend/src/db/scripts/rotate-secrets.ts [--force]
 *
 * Environment:
 *   VAULT_ENABLED=true
 *   VAULT_ADDR=http://localhost:8200
 *   VAULT_TOKEN=<vault-token>
 *
 * @see apps/docs/2*.Technical_Design_Document*.md Section 10.6
 * @see CLAUDE.md - Authentication & Session Management
 */

import { generateKeyPairSync, createHash, createPublicKey } from "node:crypto";
import { logger } from "../../config/logger.js";
import { env } from "../../config/env.js";
import {
  initializeSecretsManager,
  writeSecret,
  getSecret,
  checkSecretsHealth,
} from "../../services/secrets.service.js";

interface KeyMetadata {
  kid: string;
  createdAt: string;
  rotatedAt?: string;
  expiresAt: string;
}

/**
 * Generate new RSA-4096 key pair for JWT signing
 */
function generateKeyPair(): { privateKey: string; publicKey: string; kid: string } {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  const publicKeyPem = publicKey.toString();
  const privateKeyPem = privateKey.toString();

  // Generate kid (key ID) from public key hash
  const kid = createHash("sha256").update(publicKeyPem).digest("base64url").slice(0, 16);

  return {
    privateKey: privateKeyPem,
    publicKey: publicKeyPem,
    kid,
  };
}

/**
 * Calculate expiration date based on rotation policy
 */
function calculateExpirationDate(rotationDays: number): string {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + rotationDays);
  return expiresAt.toISOString();
}

/**
 * Check if current keys need rotation
 */
async function shouldRotate(force: boolean): Promise<boolean> {
  if (force) {
    logger.info("[rotate-secrets] Force flag set - will rotate");
    return true;
  }

  try {
    const metadataJson = await getSecret("secret/jwt", "metadata");
    if (!metadataJson) {
      logger.info("[rotate-secrets] No existing keys found - will rotate");
      return true;
    }

    const metadata = JSON.parse(metadataJson) as KeyMetadata;
    const expiresAt = new Date(metadata.expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    logger.info(
      { kid: metadata.kid, expiresAt: metadata.expiresAt, daysUntilExpiry },
      "[rotate-secrets] Current key metadata",
    );

    // Rotate if within 14 days of expiration (warning window)
    if (daysUntilExpiry <= 14) {
      logger.warn({ daysUntilExpiry }, "[rotate-secrets] Keys expiring soon - will rotate");
      return true;
    }

    logger.info({ daysUntilExpiry }, "[rotate-secrets] Keys still valid - rotation not needed");
    return false;
  } catch (error) {
    logger.error({ err: error }, "[rotate-secrets] Failed to check rotation status");
    return true; // Rotate on error to be safe
  }
}

/**
 * Rotate JWT signing keys
 */
async function rotateKeys(force: boolean): Promise<void> {
  logger.info("[rotate-secrets] Starting secrets rotation...");

  // Check if rotation is needed
  const needsRotation = await shouldRotate(force);
  if (!needsRotation) {
    logger.info("[rotate-secrets] Rotation not needed - skipping");
    return;
  }

  // Generate new key pair
  logger.info("[rotate-secrets] Generating new RSA-4096 key pair...");
  const { privateKey, publicKey, kid } = generateKeyPair();

  const now = new Date().toISOString();
  const expiresAt = calculateExpirationDate(env.jwtKeyRotationDays);

  const metadata: KeyMetadata = {
    kid,
    createdAt: now,
    rotatedAt: now,
    expiresAt,
  };

  // Write to Vault
  logger.info({ kid }, "[rotate-secrets] Writing new keys to Vault...");

  const success = await writeSecret("secret/jwt", {
    private: privateKey,
    public: publicKey,
    kid,
    metadata: JSON.stringify(metadata),
  });

  if (!success) {
    throw new Error("Failed to write keys to Vault");
  }

  logger.info(
    {
      kid,
      expiresAt,
      rotationDays: env.jwtKeyRotationDays,
    },
    "[rotate-secrets] Keys rotated successfully",
  );

  // Verify written keys
  logger.info("[rotate-secrets] Verifying written keys...");
  const storedPublic = await getSecret("secret/jwt", "public");
  const storedPrivate = await getSecret("secret/jwt", "private");

  if (!storedPublic || !storedPrivate) {
    throw new Error("Failed to verify written keys");
  }

  // Verify key format
  try {
    createPublicKey(storedPublic);
    logger.info("[rotate-secrets] Key verification successful");
  } catch (error) {
    throw new Error(
      `Invalid key format: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const force = process.argv.includes("--force");

  // Check Vault configuration
  if (!env.vault.enabled) {
    logger.error("[rotate-secrets] VAULT_ENABLED is not set to true");
    logger.error("[rotate-secrets] Set VAULT_ENABLED=true and VAULT_TOKEN in your environment");
    process.exit(1);
  }

  if (!env.vault.token) {
    logger.error("[rotate-secrets] VAULT_TOKEN is not set");
    process.exit(1);
  }

  // Initialize secrets manager
  initializeSecretsManager({
    provider: "vault",
    vault: {
      enabled: true,
      addr: env.vault.addr,
      token: env.vault.token,
      namespace: env.vault.namespace,
    },
  });

  // Check Vault health
  logger.info("[rotate-secrets] Checking Vault connectivity...");
  const healthy = await checkSecretsHealth();
  if (!healthy) {
    logger.error("[rotate-secrets] Vault health check failed");
    process.exit(1);
  }

  logger.info("[rotate-secrets] Vault connection healthy");

  // Rotate keys
  await rotateKeys(force);

  logger.info("[rotate-secrets] Secrets rotation completed");
}

main().catch((error: unknown) => {
  logger.error({ err: error }, "[rotate-secrets] Rotation failed");
  process.exit(1);
});

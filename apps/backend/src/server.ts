import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { initializeSecretsManager } from "./services/secrets.service.js";

const port = env.PORT;

// Initialize secrets manager if enabled
if (env.vault.enabled) {
  if (!env.vault.token) {
    logger.error("[server] VAULT_ENABLED=true but VAULT_TOKEN is not set");
    process.exit(1);
  }

  initializeSecretsManager({
    provider: "vault",
    vault: {
      enabled: true,
      addr: env.vault.addr,
      token: env.vault.token,
      namespace: env.vault.namespace,
    },
  });

  logger.info({ vaultAddr: env.vault.addr }, "[server] Secrets manager initialized with Vault");
} else {
  logger.info("[server] Secrets manager disabled - using environment variables");
}

app.listen(port, () => {
  logger.info({ port }, "FitVibe Backend running");
});

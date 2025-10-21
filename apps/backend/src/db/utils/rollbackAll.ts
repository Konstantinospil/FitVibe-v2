import db from "../index.js";
import { logger } from "../../config/logger.js";
import { toErrorPayload } from "../../utils/error.utils.js";

async function main(): Promise<void> {
  try {
    logger.info("[db] Rolling back all migrations...");
    await db.migrate.rollback(undefined, true);
    logger.info("[db] Rollback completed.");
  } finally {
    await db.destroy();
  }
}

main().catch((error: unknown) => {
  logger.error(toErrorPayload(error), "Failed to roll back migrations.");
  process.exit(1);
});

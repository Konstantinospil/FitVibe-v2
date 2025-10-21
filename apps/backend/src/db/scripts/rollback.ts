import db from "../index.js";
import { logger } from "../../config/logger.js";
import { toErrorPayload } from "../../utils/error.utils.js";

async function main(): Promise<void> {
  try {
    logger.info("[db] Rolling back migrations...");
    await db.migrate.rollback(undefined, true);
    logger.info("[db] Rollback complete.");
  } finally {
    await db.destroy();
  }
}

main().catch((error: unknown) => {
  logger.error(toErrorPayload(error), "Database rollback failed");
  process.exit(1);
});

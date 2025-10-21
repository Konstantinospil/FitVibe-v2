import db from "../index.js";
import { logger } from "../../config/logger.js";
import { toErrorPayload } from "../../utils/error.utils.js";

async function main(): Promise<void> {
  try {
    logger.info("[db] Applying migrations (all environments)...");
    await db.migrate.latest();
    logger.info("[db] Migrations applied successfully.");
  } finally {
    await db.destroy();
  }
}

main().catch((error: unknown) => {
  logger.error(toErrorPayload(error), "Failed to apply migrations.");
  process.exit(1);
});

import db from "../index.js";
import { logger } from "../../config/logger.js";
import { toErrorPayload } from "../../utils/error.utils.js";

async function main(): Promise<void> {
  try {
    logger.info("[db] Applying migrations...");
    await db.migrate.latest();
    logger.info("[db] Migrations applied.");
  } finally {
    await db.destroy();
  }
}

main().catch((error: unknown) => {
  logger.error(toErrorPayload(error), "Database migrations failed");
  process.exit(1);
});

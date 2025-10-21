import db from "../index.js";
import { logger } from "../../config/logger.js";
import { toErrorPayload } from "../../utils/error.utils.js";

async function main(): Promise<void> {
  try {
    logger.info("[db] Running database seeds...");
    await db.seed.run();
    logger.info("[db] Seeds completed.");
  } finally {
    await db.destroy();
  }
}

main().catch((error: unknown) => {
  logger.error(toErrorPayload(error), "Failed to run database seeds.");
  process.exit(1);
});

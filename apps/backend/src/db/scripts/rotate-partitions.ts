import db from "../index.js";
import { logger } from "../../config/logger.js";
import { toErrorPayload } from "../../utils/error.utils.js";

async function main(): Promise<void> {
  logger.info("Ensuring monthly partitions (sessions, user_points, user_state_history)...");
  await db.raw("SELECT public.ensure_monthly_partitions();");
  logger.info("Partition rotation complete.");
}

main()
  .then(() => db.destroy())
  .catch((error: unknown) => {
    logger.error(toErrorPayload(error), "Failed to rotate partitions");
    return db.destroy().finally(() => process.exit(1));
  });

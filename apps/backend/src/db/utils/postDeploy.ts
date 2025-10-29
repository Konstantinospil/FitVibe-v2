import db from "../index.js";
import { logger } from "../../config/logger.js";
import { toErrorPayload } from "../../utils/error.utils.js";

async function refreshProgressViews(): Promise<void> {
  await db.raw("SELECT public.refresh_session_summary(TRUE);");
}

async function ensurePartitions(): Promise<void> {
  await db.raw("SELECT public.ensure_monthly_partitions();");
}

async function main(): Promise<void> {
  try {
    logger.info("[post-deploy] Ensuring monthly partitions...");
    await ensurePartitions();
    logger.info(
      "[post-deploy] Refreshing analytics materialized views (session_summary, weekly_aggregates)...",
    );
    await refreshProgressViews();
    logger.info("[post-deploy] Completed database maintenance tasks.");
  } catch (error: unknown) {
    logger.error(toErrorPayload(error), "[post-deploy] Maintenance tasks failed");
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
}

main().catch((error: unknown) => {
  logger.error(toErrorPayload(error), "[post-deploy] Fatal error");
  process.exit(1);
});

import db from "../index.js";
import { logger } from "../../config/logger.js";
import { toErrorPayload } from "../../utils/error.utils.js";

async function main(): Promise<void> {
  logger.info(
    "Refreshing analytics materialized views (session_summary, weekly_aggregates, leaderboard)...",
  );
  await db.raw("SELECT public.refresh_session_summary(TRUE);");
  await db.raw("REFRESH MATERIALIZED VIEW mv_leaderboard;");
  logger.info("Materialized views refreshed.");
}

main()
  .then(() => db.destroy())
  .catch((error: unknown) => {
    logger.error(toErrorPayload(error), "Failed to refresh materialized views");
    return db.destroy().finally(() => process.exit(1));
  });

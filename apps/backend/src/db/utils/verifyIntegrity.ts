import { db } from "../connection.js";
import { logger } from "../../config/logger.js";
import { toErrorPayload } from "../../utils/error.utils.js";

const TABLES = [
  "roles",
  "genders",
  "fitness_levels",
  "exercise_types",
  "users",
  "user_static",
  "user_contacts",
  "auth_sessions",
  "user_state_history",
  "audit_log",
  "user_metrics",
  "exercises",
  "sessions",
  "session_exercises",
  "exercise_sets",
  "planned_exercise_attributes",
  "actual_exercise_attributes",
  "user_points",
  "plans",
  "badges",
  "followers",
  "media",
  "translation_cache",
];

const VIEWS = ["session_summary", "v_session_summary"];

async function verify(): Promise<void> {
  try {
    logger.info("Verifying database objects...");
    for (const table of TABLES) {
      const exists = await db.schema.hasTable(table);
      logger.info(`${table.padEnd(40)} ${exists ? "present" : "missing"}`);
    }
    for (const view of VIEWS) {
      const result = await db
        .select("matviewname")
        .from("pg_matviews")
        .where("matviewname", view)
        .union([db.select("viewname as matviewname").from("pg_views").where("viewname", view)]);
      logger.info(`${view.padEnd(40)} ${result.length > 0 ? "present" : "missing"}`);
    }
  } finally {
    await db.destroy();
  }
}

verify().catch((error: unknown) => {
  logger.error(toErrorPayload(error), "Integrity verification failed");
  process.exit(1);
});

import { db } from "../connection.js";

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
  "session_exercises",\n  "exercise_sets",\n  "planned_exercise_attributes",
  "actual_exercise_attributes",
  "user_points",\n  "plans",\n  "badges",
  "followers",
  "media",
  "translation_cache",
];

const VIEWS = ["session_summary", "v_session_summary"];

async function verify(): Promise<void> {
  try {
    console.log("Verifying database objects...");
    for (const table of TABLES) {
      const exists = await db.schema.hasTable(table);
      console.log(`${table.padEnd(40)} ${exists ? "present" : "missing"}`);
    }
    for (const view of VIEWS) {
      const result = await db
        .select("matviewname")
        .from("pg_matviews")
        .where("matviewname", view)
        .union([
          db
            .select("viewname as matviewname")
            .from("pg_views")
            .where("viewname", view),
        ]);
      console.log(
        `${view.padEnd(40)} ${result.length > 0 ? "present" : "missing"}`,
      );
    }
  } finally {
    await db.destroy();
  }
}

verify().catch((error) => {
  console.error("Integrity verification failed", error);
  process.exit(1);
});


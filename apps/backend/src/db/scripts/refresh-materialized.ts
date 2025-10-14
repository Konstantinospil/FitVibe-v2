import db from "../index.js";

async function main() {
  console.log("Refreshing materialized views (session_summary)...");
  await db.raw("SELECT public.refresh_session_summary(TRUE);");
  console.log("Materialized views refreshed.");
}

main()
  .then(() => db.destroy())
  .catch((error) => {
    console.error("Failed to refresh materialized views", error);
    return db.destroy().finally(() => process.exit(1));
  });

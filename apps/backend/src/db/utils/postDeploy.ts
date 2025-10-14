import db from "../index.js";

async function refreshSessionSummary(): Promise<void> {
  await db.raw("SELECT public.refresh_session_summary(TRUE);");
}

async function ensurePartitions(): Promise<void> {
  await db.raw("SELECT public.ensure_monthly_partitions();");
}

async function main(): Promise<void> {
  try {
    console.log("[post-deploy] Ensuring monthly partitions...");
    await ensurePartitions();
    console.log("[post-deploy] Refreshing session_summary materialized view...");
    await refreshSessionSummary();
    console.log("[post-deploy] Completed database maintenance tasks.");
  } catch (error) {
    console.error("[post-deploy] Maintenance tasks failed:", error);
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
}

main().catch((error) => {
  console.error("[post-deploy] Fatal error", error);
  process.exit(1);
});

import db from "../index.js";

async function main(): Promise<void> {
  try {
    console.log("[db] Rolling back migrations...");
    await db.migrate.rollback(undefined, true);
    console.log("[db] Rollback complete.");
  } finally {
    await db.destroy();
  }
}

main().catch((error) => {
  console.error("Database rollback failed", error);
  process.exit(1);
});

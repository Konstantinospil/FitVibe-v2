import db from "../index.js";

async function main(): Promise<void> {
  try {
    console.log("[db] Rolling back all migrations...");
    await db.migrate.rollback(undefined, true);
    console.log("[db] Rollback completed.");
  } finally {
    await db.destroy();
  }
}

main().catch((error) => {
  console.error("Failed to roll back migrations.", error);
  process.exit(1);
});

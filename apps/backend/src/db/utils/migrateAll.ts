import db from "../index.js";

async function main(): Promise<void> {
  try {
    console.log("[db] Applying migrations (all environments)...");
    await db.migrate.latest();
    console.log("[db] Migrations applied successfully.");
  } finally {
    await db.destroy();
  }
}

main().catch((error) => {
  console.error("Failed to apply migrations.", error);
  process.exit(1);
});

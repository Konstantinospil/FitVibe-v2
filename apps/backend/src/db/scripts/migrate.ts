import db from "../index.js";

async function main(): Promise<void> {
  try {
    console.log("[db] Applying migrations...");
    await db.migrate.latest();
    console.log("[db] Migrations applied.");
  } finally {
    await db.destroy();
  }
}

main().catch((error) => {
  console.error("Database migrations failed", error);
  process.exit(1);
});

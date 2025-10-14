import db from "../index.js";

async function main(): Promise<void> {
  try {
    console.log("[db] Running database seeds...");
    await db.seed.run();
    console.log("[db] Seeds completed.");
  } finally {
    await db.destroy();
  }
}

main().catch((error) => {
  console.error("Failed to run database seeds.", error);
  process.exit(1);
});

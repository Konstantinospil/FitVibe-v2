import db from "../index.js";

async function main() {
  console.log("Ensuring monthly partitions (sessions, user_points, user_state_history)...");
  await db.raw("SELECT public.ensure_monthly_partitions();");
  console.log("Partition rotation complete.");
}

main()
  .then(() => db.destroy())
  .catch((error) => {
    console.error("Failed to rotate partitions", error);
    return db.destroy().finally(() => process.exit(1));
  });

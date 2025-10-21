import { spawnSync } from "child_process";
import { logger } from "../../config/logger.js";
import { DB_CONFIG } from "../db.config.js";

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const file = `backup_${DB_CONFIG.database}_${timestamp}.sql`;

logger.info(`Creating database backup: ${file}`);

const result = spawnSync(
  "pg_dump",
  [
    `--host=${DB_CONFIG.host}`,
    `--port=${DB_CONFIG.port}`,
    `--username=${DB_CONFIG.user}`,
    "--no-password",
    "--format=p",
    `--file=${file}`,
    DB_CONFIG.database,
  ],
  { stdio: "inherit" },
);

if ((result.status ?? 1) === 0) {
  logger.info("Backup completed successfully.");
} else {
  logger.error("Backup failed.");
  process.exit(result.status ?? 1);
}

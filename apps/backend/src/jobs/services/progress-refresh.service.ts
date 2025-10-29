import { logger } from "../../config/logger.js";
import { refreshSessionSummary } from "../../modules/sessions/sessions.repository.js";

export class ProgressRefreshService {
  async refreshAll(concurrent = true): Promise<void> {
    await refreshSessionSummary(concurrent);
    logger.info({ concurrent }, "[jobs] Progress analytics materialized views refreshed");
  }
}

export const progressRefreshService = new ProgressRefreshService();

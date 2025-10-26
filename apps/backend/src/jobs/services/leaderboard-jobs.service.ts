import { logger } from "../../config/logger.js";
import type { QueueJob } from "./queue.service.js";
import { queueService } from "./queue.service.js";

const REFRESH_JOB_NAME = "leaderboard.refresh";

export class LeaderboardJobsService {
  scheduleRefresh(period: "week" | "month", triggeredBy: "cron" | "manual" = "manual"): QueueJob {
    const job: QueueJob = {
      name: REFRESH_JOB_NAME,
      payload: {
        period,
        triggeredBy,
        queuedAt: new Date().toISOString(),
      },
    };

    queueService.enqueue(job);
    logger.debug({ job }, "[jobs] enqueued leaderboard refresh");
    return job;
  }
}

export const leaderboardJobsService = new LeaderboardJobsService();

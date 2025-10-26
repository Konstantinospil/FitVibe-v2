import { logger } from "../../config/logger.js";
import type { QueueJob } from "./queue.service.js";
import { queueService } from "./queue.service.js";

const RETENTION_JOB_NAME = "retention.sweep";

export class RetentionJobsService {
  scheduleSweep(triggeredBy: "cron" | "manual" = "manual"): QueueJob {
    const job: QueueJob = {
      name: RETENTION_JOB_NAME,
      payload: {
        triggeredBy,
        queuedAt: new Date().toISOString(),
      },
    };

    queueService.enqueue(job);
    logger.debug({ job }, "[jobs] enqueued retention sweep");
    return job;
  }
}

export const retentionJobsService = new RetentionJobsService();

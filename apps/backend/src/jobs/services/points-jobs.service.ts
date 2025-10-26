import { logger } from "../../config/logger.js";
import type { QueueJob } from "./queue.service.js";
import { queueService } from "./queue.service.js";

export class PointsJobsService {
  schedule(job: QueueJob): void {
    queueService.enqueue(job);
    logger.debug({ job }, "[jobs] Enqueued points job");
  }

  scheduleStreakEvaluation(userId: string, sessionId: string, completedAt: string): void {
    this.schedule({
      name: "points.streaks.evaluate",
      payload: {
        userId,
        sessionId,
        completedAt,
      },
    });
  }

  scheduleSeasonalEventSweep(userId: string, sessionId: string, completedAt: string): void {
    this.schedule({
      name: "points.seasonal_events.evaluate",
      payload: {
        userId,
        sessionId,
        completedAt,
      },
    });
  }
}

export const pointsJobsService = new PointsJobsService();

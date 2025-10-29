import { v4 as uuidv4 } from "uuid";
import type { Knex } from "knex";

import {
  countCompletedSessions,
  getBadgeCatalog,
  getCompletedSessionDatesInRange,
  getUserBadgeCodes,
  insertBadgeAward,
} from "./points.repository.js";
import type { BadgeEvaluationResult, SessionMetricsSnapshot } from "./points.types.js";
import type { SessionWithExercises } from "../sessions/sessions.types.js";

const BADGE_CODES = {
  FIRST_SESSION: "first_session",
  STREAK_7_DAY: "streak_7_day",
  RUN_10K: "run_10k",
  RIDE_100K: "ride_100k",
} as const;

function truncateIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface BadgeEvaluationParams {
  session: SessionWithExercises;
  metrics: SessionMetricsSnapshot;
  trx: Knex.Transaction;
}

export async function evaluateBadgesForSession({
  session,
  metrics,
  trx,
}: BadgeEvaluationParams): Promise<BadgeEvaluationResult[]> {
  const completedAt = new Date(session.completed_at ?? new Date());
  const catalog = await getBadgeCatalog(trx);
  const owned = await getUserBadgeCodes(session.owner_id, trx);
  const awarded: BadgeEvaluationResult[] = [];

  async function enqueueAward(badgeCode: string, metadata: Record<string, unknown>): Promise<void> {
    if (owned.has(badgeCode)) {
      return;
    }
    if (!catalog.has(badgeCode)) {
      return;
    }
    await insertBadgeAward(
      {
        id: uuidv4(),
        user_id: session.owner_id,
        badge_type: badgeCode,
        metadata,
        awarded_at: completedAt,
      },
      trx,
    );
    owned.add(badgeCode);
    awarded.push({ badgeCode, metadata });
  }

  if (!owned.has(BADGE_CODES.FIRST_SESSION)) {
    const completedCount = await countCompletedSessions(session.owner_id, trx);
    if (completedCount === 1) {
      await enqueueAward(BADGE_CODES.FIRST_SESSION, {
        session_id: session.id,
        awarded_at: completedAt.toISOString(),
      });
    }
  }

  if (!owned.has(BADGE_CODES.STREAK_7_DAY)) {
    const streakLength = 7;
    const endDate = truncateIsoDate(completedAt);
    const streakStart = new Date(completedAt);
    streakStart.setUTCDate(streakStart.getUTCDate() - (streakLength - 1));
    streakStart.setUTCHours(0, 0, 0, 0);

    const streakDays = await getCompletedSessionDatesInRange(
      session.owner_id,
      streakStart,
      completedAt,
      trx,
    );
    let streakMet = true;
    const cursor = new Date(streakStart);
    while (cursor <= completedAt) {
      if (!streakDays.has(truncateIsoDate(cursor))) {
        streakMet = false;
        break;
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    if (streakMet) {
      await enqueueAward(BADGE_CODES.STREAK_7_DAY, {
        session_id: session.id,
        streak_days: streakLength,
        start_date: truncateIsoDate(streakStart),
        end_date: endDate,
      });
    }
  }

  if (!owned.has(BADGE_CODES.RUN_10K) && metrics.runDistanceMeters >= 10_000) {
    await enqueueAward(BADGE_CODES.RUN_10K, {
      session_id: session.id,
      distance_m: Math.round(metrics.runDistanceMeters),
    });
  }

  if (!owned.has(BADGE_CODES.RIDE_100K) && metrics.rideDistanceMeters >= 100_000) {
    await enqueueAward(BADGE_CODES.RIDE_100K, {
      session_id: session.id,
      distance_m: Math.round(metrics.rideDistanceMeters),
    });
  }

  return awarded;
}

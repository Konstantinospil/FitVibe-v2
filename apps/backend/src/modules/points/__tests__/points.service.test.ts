import type { Knex } from "knex";

import { awardPointsForSession, getPointsHistory, getPointsSummary } from "../points.service.js";
import type { SessionWithExercises } from "../../sessions/sessions.types";
import {
  findPointsEventBySource,
  getExercisesMetadata,
  getPointsBalance,
  getPointsHistory as repoGetPointsHistory,
  getRecentPointsEvents,
  getUserPointsProfile,
  insertPointsEvent,
} from "../points.repository.js";
import { evaluateBadgesForSession } from "../badges.service.js";
import { updateSession } from "../../sessions/sessions.repository.js";
import { incrementPointsAwarded } from "../../../observability/metrics.js";
import { pointsJobsService } from "../../../jobs/services/points-jobs.service.js";
import { db } from "../../../db/connection.js";
import type { PointsEventRecord } from "../points.types.js";

jest.mock("../points.repository.js", () => ({
  findPointsEventBySource: jest.fn(),
  insertPointsEvent: jest.fn(),
  getPointsBalance: jest.fn(),
  getRecentPointsEvents: jest.fn(),
  getPointsHistory: jest.fn(),
  getUserPointsProfile: jest.fn(),
  getExercisesMetadata: jest.fn(),
  countCompletedSessions: jest.fn(),
  getCompletedSessionDatesInRange: jest.fn(),
}));

jest.mock("../badges.service.js", () => ({
  evaluateBadgesForSession: jest.fn(),
}));

jest.mock("../../sessions/sessions.repository.js", () => ({
  updateSession: jest.fn(),
}));

jest.mock("../../../observability/metrics.js", () => ({
  incrementPointsAwarded: jest.fn(),
}));

jest.mock("../../../jobs/services/points-jobs.service.js", () => ({
  pointsJobsService: {
    scheduleStreakEvaluation: jest.fn(),
    scheduleSeasonalEventSweep: jest.fn(),
  },
}));

jest.mock("../../../db/connection.js", () => ({
  db: Object.assign(jest.fn(), {
    transaction: jest.fn(),
  }),
}));

const mockedFindPointsEventBySource = findPointsEventBySource as jest.MockedFunction<
  typeof findPointsEventBySource
>;
const mockedInsertPointsEvent = insertPointsEvent as jest.MockedFunction<typeof insertPointsEvent>;
const mockedGetUserPointsProfile = getUserPointsProfile as jest.MockedFunction<
  typeof getUserPointsProfile
>;
const mockedGetExercisesMetadata = getExercisesMetadata as jest.MockedFunction<
  typeof getExercisesMetadata
>;
const mockedUpdateSession = updateSession as jest.MockedFunction<typeof updateSession>;
const mockedEvaluateBadgesForSession = evaluateBadgesForSession as jest.MockedFunction<
  typeof evaluateBadgesForSession
>;
const mockedIncrementPointsAwarded = incrementPointsAwarded as jest.MockedFunction<
  typeof incrementPointsAwarded
>;
const mockedPointsJobsService = pointsJobsService as unknown as {
  scheduleStreakEvaluation: jest.MockedFunction<
    (userId: string, sessionId: string, completedAt: string) => void
  >;
  scheduleSeasonalEventSweep: jest.MockedFunction<
    (userId: string, sessionId: string, completedAt: string) => void
  >;
};
const mockedGetPointsBalance = getPointsBalance as jest.MockedFunction<typeof getPointsBalance>;
const mockedGetRecentPointsEvents = getRecentPointsEvents as jest.MockedFunction<
  typeof getRecentPointsEvents
>;
const mockedRepoGetPointsHistory = repoGetPointsHistory as jest.MockedFunction<
  typeof repoGetPointsHistory
>;

type TransactionHandler = (trx: Knex.Transaction) => unknown;
type DbMock = jest.Mock & {
  transaction: jest.Mock<Promise<unknown>, [TransactionHandler]>;
};

const mockedDb = db as unknown as DbMock;
const mockedTransaction = mockedDb.transaction;

beforeEach(() => {
  jest.clearAllMocks();
  mockedTransaction.mockImplementation(async (handler: TransactionHandler) => {
    return handler({} as unknown as Knex.Transaction);
  });
});

function buildCompletedSession(
  overrides: Partial<SessionWithExercises> = {},
): SessionWithExercises {
  const now = new Date();
  const completedAt = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  return {
    id: "session-1",
    owner_id: "user-1",
    plan_id: null,
    title: "Morning Run",
    planned_at: now.toISOString(),
    status: "completed",
    visibility: "private",
    notes: null,
    recurrence_rule: null,
    started_at: null,
    completed_at: completedAt,
    calories: 400,
    points: null,
    deleted_at: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    exercises: [
      {
        id: "exercise-instance-1",
        session_id: "session-1",
        exercise_id: "exercise-1",
        order_index: 1,
        notes: null,
        planned: null,
        actual: {
          sets: null,
          reps: null,
          load: null,
          distance: 10,
          duration: "PT45M",
          rpe: 7,
          rest: null,
          extras: {},
          recorded_at: completedAt,
        },
        sets: [],
      },
    ],
    ...overrides,
  };
}

describe("awardPointsForSession", () => {
  it("awards points, evaluates badges, and schedules jobs for a new completion", async () => {
    mockedFindPointsEventBySource.mockResolvedValue(undefined);
    mockedGetUserPointsProfile.mockResolvedValue({
      dateOfBirth: "1995-01-01",
      genderCode: "female",
      fitnessLevelCode: "beginner",
      trainingFrequency: "3x_week",
    });
    mockedGetExercisesMetadata.mockResolvedValue(
      new Map([
        [
          "exercise-1",
          {
            id: "exercise-1",
            type_code: "cardio",
            tags: ["run"],
          },
        ],
      ]),
    );
    const eventRecord: PointsEventRecord = {
      id: "event-1",
      user_id: "user-1",
      source_type: "session_completed",
      source_id: "session-1",
      algorithm_version: "v1",
      points: 142,
      calories: 400,
      metadata: {},
      awarded_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    mockedInsertPointsEvent.mockResolvedValue(eventRecord);
    mockedEvaluateBadgesForSession.mockResolvedValue([
      { badgeCode: "first_session", metadata: {} },
    ]);

    const result = await awardPointsForSession(buildCompletedSession());

    expect(result).toEqual({
      awarded: true,
      pointsAwarded: 142,
      eventId: "event-1",
      badgesAwarded: ["first_session"],
    });
    expect(mockedInsertPointsEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        source_type: "session_completed",
        source_id: "session-1",
        points: 142,
      }),
      expect.any(Object),
    );
    expect(mockedUpdateSession).toHaveBeenCalledWith(
      "session-1",
      "user-1",
      expect.objectContaining({ points: 142 }),
      expect.any(Object),
    );
    expect(mockedIncrementPointsAwarded).toHaveBeenCalledWith("session_completed", 142);
    expect(mockedPointsJobsService.scheduleStreakEvaluation).toHaveBeenCalledTimes(1);
    expect(mockedPointsJobsService.scheduleSeasonalEventSweep).toHaveBeenCalledTimes(1);
  });

  it("reuses existing points event when already awarded", async () => {
    const existingEvent: PointsEventRecord = {
      id: "event-existing",
      user_id: "user-1",
      source_type: "session_completed",
      source_id: "session-1",
      algorithm_version: "v1",
      points: 120,
      calories: 300,
      metadata: {},
      awarded_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    mockedFindPointsEventBySource.mockResolvedValue(existingEvent);

    const session = buildCompletedSession();
    session.points = null;

    const result = await awardPointsForSession(session);

    expect(result).toEqual({
      awarded: false,
      pointsAwarded: 120,
      eventId: "event-existing",
      badgesAwarded: [],
    });
    expect(mockedInsertPointsEvent).not.toHaveBeenCalled();
    expect(mockedIncrementPointsAwarded).not.toHaveBeenCalled();
    expect(mockedUpdateSession).toHaveBeenCalledWith(
      "session-1",
      "user-1",
      expect.objectContaining({ points: 120 }),
      expect.any(Object),
    );
    expect(mockedPointsJobsService.scheduleStreakEvaluation).not.toHaveBeenCalled();
    expect(mockedPointsJobsService.scheduleSeasonalEventSweep).not.toHaveBeenCalled();
  });
});

describe("getPointsSummary", () => {
  it("returns balance and recent events", async () => {
    mockedGetPointsBalance.mockResolvedValue(180);
    mockedGetRecentPointsEvents.mockResolvedValue([
      {
        id: "evt-1",
        user_id: "user-1",
        source_type: "session_completed",
        source_id: "session-1",
        algorithm_version: "v1",
        points: 100,
        calories: 300,
        metadata: {},
        awarded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ]);

    const summary = await getPointsSummary("user-1");
    expect(summary.balance).toBe(180);
    expect(summary.recent).toHaveLength(1);
    expect(mockedGetPointsBalance).toHaveBeenCalledWith("user-1");
  });
});

describe("getPointsHistory", () => {
  it("limits results and produces a cursor", async () => {
    const baseTime = new Date("2025-10-26T09:00:00.000Z");
    const rows: PointsEventRecord[] = [
      {
        id: "evt-1",
        user_id: "user-1",
        source_type: "session_completed",
        source_id: "session-1",
        algorithm_version: "v1",
        points: 90,
        calories: 250,
        metadata: {},
        awarded_at: baseTime.toISOString(),
        created_at: baseTime.toISOString(),
      },
      {
        id: "evt-2",
        user_id: "user-1",
        source_type: "streak_bonus",
        source_id: null,
        algorithm_version: "v1",
        points: 15,
        calories: null,
        metadata: {},
        awarded_at: new Date(baseTime.getTime() - 3600_000).toISOString(),
        created_at: new Date(baseTime.getTime() - 3600_000).toISOString(),
      },
      {
        id: "evt-3",
        user_id: "user-1",
        source_type: "session_completed",
        source_id: "session-0",
        algorithm_version: "v1",
        points: 70,
        calories: 200,
        metadata: {},
        awarded_at: new Date(baseTime.getTime() - 2 * 3600_000).toISOString(),
        created_at: new Date(baseTime.getTime() - 2 * 3600_000).toISOString(),
      },
    ];
    mockedRepoGetPointsHistory.mockResolvedValue(rows);

    const history = await getPointsHistory("user-1", { limit: 2 });

    expect(mockedRepoGetPointsHistory).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ limit: 3 }),
    );
    expect(history.items).toHaveLength(2);
    expect(history.nextCursor).toBe(`${rows[2].awarded_at}|${rows[2].id}`);
  });
});

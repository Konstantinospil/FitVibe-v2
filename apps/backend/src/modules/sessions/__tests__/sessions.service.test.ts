import { v4 as uuidv4 } from "uuid";
import { createOne, updateOne, cloneOne, applyRecurrence, cancelOne } from "../sessions.service";
import type { Session, SessionWithExercises } from "../sessions.types";
import { HttpError } from "../../../utils/http";
import { db } from "../../../db/connection.js";
import { recomputeProgress } from "../../plans/plans.service";
import { insertAudit } from "../../common/audit.util.js";
import {
  createSession,
  getSessionById,
  getSessionWithDetails,
  updateSession,
  cancelSession,
  replaceSessionExercises,
  refreshSessionSummary,
  sessionsExistAtDates,
} from "../sessions.repository";
import * as pointsService from "../../points/points.service";

type TransactionHandler = (trx: jest.Mock) => unknown;

jest.mock("uuid", () => ({
  v4: jest.fn(),
}));

jest.mock("../../../db/connection.js", () => ({
  db: Object.assign(jest.fn<unknown, []>(), {
    transaction: jest.fn<Promise<unknown>, [TransactionHandler]>(),
  }),
}));

type DbMock = jest.Mock<unknown, []> & {
  transaction: jest.Mock<Promise<unknown>, [TransactionHandler]>;
};

jest.mock("../../plans/plans.service", () => ({
  recomputeProgress: jest.fn(),
}));

jest.mock("../../common/audit.util.js", () => ({
  insertAudit: jest.fn(),
}));

jest.mock("../sessions.repository", () => ({
  listSessions: jest.fn(),
  getSessionById: jest.fn(),
  getSessionWithDetails: jest.fn(),
  createSession: jest.fn(),
  updateSession: jest.fn(),
  cancelSession: jest.fn(),
  replaceSessionExercises: jest.fn(),
  refreshSessionSummary: jest.fn(),
  sessionsExistAtDates: jest.fn(),
}));

const mockedUuid = uuidv4 as jest.MockedFunction<() => string>;
const mockedDb = db as unknown as DbMock;
const mockedTransaction = mockedDb.transaction;
const mockedCreateSession = createSession as jest.MockedFunction<typeof createSession>;
const mockedUpdateSession = updateSession as jest.MockedFunction<typeof updateSession>;
const mockedCancelSession = cancelSession as jest.MockedFunction<typeof cancelSession>;
const mockedReplaceSessionExercises = replaceSessionExercises as jest.MockedFunction<
  typeof replaceSessionExercises
>;
const mockedGetSessionById = getSessionById as jest.MockedFunction<typeof getSessionById>;
const mockedGetSessionWithDetails = getSessionWithDetails as jest.MockedFunction<
  typeof getSessionWithDetails
>;
const mockedRecomputeProgress = recomputeProgress as jest.MockedFunction<typeof recomputeProgress>;
const mockedInsertAudit = insertAudit as jest.MockedFunction<typeof insertAudit>;
const awardPointsForSessionMock = jest.spyOn(pointsService, "awardPointsForSession");
const mockedRefreshSessionSummary = refreshSessionSummary as jest.MockedFunction<
  typeof refreshSessionSummary
>;
const mockedSessionsExistAtDates = sessionsExistAtDates as jest.MockedFunction<
  typeof sessionsExistAtDates
>;

const USER_ID = "user-123";
const SESSION_ID = "session-123";

function setupTransaction(planResult?: unknown) {
  const first = jest.fn<Promise<unknown>, []>().mockResolvedValue(planResult);
  const where = jest.fn(() => ({ first }));
  const select = jest.fn(() => ({ where, first }));
  const trx = jest.fn<unknown, [string]>((table) => {
    if (table === "plans") {
      return { select, where, first };
    }
    throw new Error(`Unexpected table "${table}"`);
  });
  mockedTransaction.mockImplementation((handler) => Promise.resolve(handler(trx)));
  return { trx, where, first, select };
}

describe("sessions.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    awardPointsForSessionMock.mockReset().mockResolvedValue({
      awarded: true,
      pointsAwarded: 120,
      eventId: "event-1",
      badgesAwarded: [],
    });
    mockedUuid.mockReset();
    mockedDb.mockReset();
    mockedDb.transaction = mockedTransaction;
    mockedTransaction.mockReset();
    mockedCreateSession.mockReset();
    mockedUpdateSession.mockReset();
    mockedCancelSession.mockReset();
    mockedReplaceSessionExercises.mockReset();
    mockedGetSessionById.mockReset();
    mockedGetSessionWithDetails.mockReset();
    mockedRecomputeProgress.mockReset();
    mockedInsertAudit.mockReset();
    mockedRefreshSessionSummary.mockReset();
    mockedSessionsExistAtDates.mockReset();

    mockedCreateSession.mockResolvedValue([]);
    mockedUpdateSession.mockResolvedValue(1);
    mockedCancelSession.mockResolvedValue(1);
    mockedReplaceSessionExercises.mockResolvedValue();
    mockedRefreshSessionSummary.mockResolvedValue(undefined);
    mockedSessionsExistAtDates.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("createOne", () => {
    it("creates session with normalized exercises and refreshes summary", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2025-10-10T08:00:00.000Z"));
      setupTransaction({ id: "plan-001", user_id: USER_ID });

      mockedUuid
        .mockImplementationOnce(() => "exercise-1")
        .mockImplementationOnce(() => "set-1")
        .mockImplementationOnce(() => "set-2")
        .mockImplementationOnce(() => "session-uuid");

      const dto = {
        plan_id: "plan-001",
        title: "  Morning Run  ",
        planned_at: "2025-10-19T10:00:00.000Z",
        notes: "  keep pace  ",
        recurrence_rule: "  FREQ=WEEKLY;COUNT=4  ",
        visibility: "public" as const,
        exercises: [
          {
            order: 1,
            notes: "  heavy day ",
            planned: {
              sets: 5,
              reps: 3,
              load: 120,
              rest: "00:03:00",
              extras: { tempo: "31X1" },
            },
            actual: {
              sets: 5,
              reps: 3,
              load: 122.5,
              recorded_at: "2025-10-19T12:00:00.000Z",
            },
            sets: [
              { order: 2, reps: 5, weight_kg: 100 },
              { order: 1, reps: 3, weight_kg: 110, notes: "  top set " },
            ],
          },
        ],
      };

      const created: SessionWithExercises = {
        id: "session-uuid",
        owner_id: USER_ID,
        plan_id: dto.plan_id,
        title: "Morning Run",
        planned_at: dto.planned_at,
        status: "planned",
        visibility: "public",
        notes: "keep pace",
        recurrence_rule: "FREQ=WEEKLY;COUNT=4",
        exercises: [
          {
            id: "existing-exercise",
            session_id: "source-session",
            exercise_id: "exercise-123",
            order_index: 1,
            notes: null,
            planned: {
              sets: 3,
              reps: 5,
              load: 120,
              rest: "00:02:00",
              extras: { tempo: "21X1" },
            },
            actual: null,
            sets: [
              {
                id: "existing-set-1",
                order_index: 1,
                reps: 5,
                weight_kg: 120,
                distance_m: null,
                duration_sec: null,
                rpe: 8,
                notes: null,
              },
            ],
            created_at: undefined,
            updated_at: undefined,
          },
        ],
        created_at: "2025-10-10T08:00:00.000Z",
        updated_at: "2025-10-10T08:00:00.000Z",
      };

      mockedGetSessionWithDetails.mockResolvedValueOnce(created);

      const result = await createOne(USER_ID, dto);

      expect(mockedTransaction).toHaveBeenCalledTimes(1);
      expect(mockedCreateSession).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "session-uuid",
          owner_id: USER_ID,
          title: "Morning Run",
          notes: "keep pace",
          recurrence_rule: "FREQ=WEEKLY;COUNT=4",
          visibility: "public",
        }),
        expect.any(Function),
      );
      expect(mockedReplaceSessionExercises).toHaveBeenCalledWith(
        expect.any(Function),
        "session-uuid",
        expect.any(Array),
      );
      expect(mockedInsertAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          actorUserId: USER_ID,
          entityId: "session-uuid",
        }),
      );
      expect(mockedRecomputeProgress).toHaveBeenCalledWith(USER_ID, "plan-001");
      expect(mockedRefreshSessionSummary).toHaveBeenCalledTimes(1);
      expect(result).toEqual(created);
    });

    it("rejects creation when plan does not belong to user", async () => {
      setupTransaction(undefined);

      await expect(
        createOne(USER_ID, {
          plan_id: "missing",
          planned_at: "2025-10-19T10:00:00.000Z",
          exercises: [],
        }),
      ).rejects.toMatchObject({
        code: "E.SESSION.INVALID_PLAN",
        status: 400,
      });

      expect(mockedCreateSession).not.toHaveBeenCalled();
      expect(mockedRefreshSessionSummary).not.toHaveBeenCalled();
    });
  });

  describe("updateOne", () => {
    it("rejects invalid status transitions", async () => {
      mockedGetSessionById.mockResolvedValueOnce({
        id: SESSION_ID,
        owner_id: USER_ID,
        plan_id: null,
        planned_at: "2025-10-19T10:00:00.000Z",
        status: "completed",
        visibility: "private",
      } as Session);

      await expect(
        updateOne(USER_ID, SESSION_ID, { status: "in_progress" }),
      ).rejects.toBeInstanceOf(HttpError);

      expect(mockedUpdateSession).not.toHaveBeenCalled();
      expect(mockedRefreshSessionSummary).not.toHaveBeenCalled();
    });

    it("moves a session to in_progress and refreshes summary", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2025-10-11T07:00:00.000Z"));
      setupTransaction();

      const current: Session = {
        id: SESSION_ID,
        owner_id: USER_ID,
        plan_id: "plan-1",
        planned_at: "2025-10-19T10:00:00.000Z",
        status: "planned",
        visibility: "private",
      };
      const detailed: SessionWithExercises = {
        ...current,
        status: "in_progress",
        started_at: "2025-10-11T07:00:00.000Z",
        exercises: [
          {
            id: "existing-exercise",
            session_id: "source-session",
            exercise_id: "exercise-123",
            order_index: 1,
            notes: null,
            planned: {
              sets: 3,
              reps: 5,
              load: 120,
              rest: "00:02:00",
              extras: { tempo: "21X1" },
            },
            actual: null,
            sets: [
              {
                id: "existing-set-1",
                order_index: 1,
                reps: 5,
                weight_kg: 120,
                distance_m: null,
                duration_sec: null,
                rpe: 8,
                notes: null,
              },
            ],
            created_at: undefined,
            updated_at: undefined,
          },
        ],
      };

      mockedGetSessionById.mockResolvedValueOnce(current);
      mockedUpdateSession.mockResolvedValueOnce(1);
      mockedReplaceSessionExercises.mockResolvedValueOnce();
      mockedGetSessionWithDetails.mockResolvedValueOnce(detailed);

      const result = await updateOne(USER_ID, SESSION_ID, {
        status: "in_progress",
        exercises: [
          {
            id: "exercise-existing",
            order: 1,
            sets: [{ id: "set-existing", order: 1, reps: 5 }],
          },
        ],
      });

      expect(mockedUpdateSession).toHaveBeenCalledWith(
        SESSION_ID,
        USER_ID,
        expect.objectContaining({ status: "in_progress" }),
        expect.any(Function),
      );
      expect(mockedReplaceSessionExercises).toHaveBeenCalledTimes(1);
      expect(mockedRefreshSessionSummary).toHaveBeenCalledTimes(1);
      expect(result).toEqual(detailed);
    });

    it("refreshes summary when status changes to completed", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2025-10-14T07:00:00.000Z"));
      setupTransaction();

      const current: Session = {
        id: SESSION_ID,
        owner_id: USER_ID,
        plan_id: "plan-1",
        planned_at: "2025-10-19T10:00:00.000Z",
        status: "in_progress",
        visibility: "private",
      };
      const completed: SessionWithExercises = {
        ...current,
        status: "completed",
        completed_at: "2025-10-14T07:00:00.000Z",
        exercises: [
          {
            id: "existing-exercise",
            session_id: "source-session",
            exercise_id: "exercise-123",
            order_index: 1,
            notes: null,
            planned: {
              sets: 3,
              reps: 5,
              load: 120,
              rest: "00:02:00",
              extras: { tempo: "21X1" },
            },
            actual: null,
            sets: [
              {
                id: "existing-set-1",
                order_index: 1,
                reps: 5,
                weight_kg: 120,
                distance_m: null,
                duration_sec: null,
                rpe: 8,
                notes: null,
              },
            ],
            created_at: undefined,
            updated_at: undefined,
          },
        ],
      };

      mockedGetSessionById.mockResolvedValueOnce(current);
      mockedUpdateSession.mockResolvedValueOnce(1);
      mockedGetSessionWithDetails.mockResolvedValueOnce(completed);

      const result = await updateOne(USER_ID, SESSION_ID, { status: "completed" });

      expect(mockedReplaceSessionExercises).not.toHaveBeenCalled();
      expect(mockedRefreshSessionSummary).toHaveBeenCalledTimes(1);
      expect(result.status).toBe("completed");
    });

    it("throws for duplicate set order", async () => {
      mockedGetSessionById.mockResolvedValueOnce({
        id: SESSION_ID,
        owner_id: USER_ID,
        plan_id: null,
        planned_at: "2025-10-19T10:00:00.000Z",
        status: "planned",
        visibility: "private",
      } as Session);

      await expect(
        updateOne(USER_ID, SESSION_ID, {
          exercises: [
            {
              order: 1,
              sets: [
                { order: 1, reps: 5 },
                { order: 1, reps: 3 },
              ],
            },
          ],
        }),
      ).rejects.toMatchObject({
        code: "E.SESSION.INVALID_SET",
        status: 422,
      });

      expect(mockedUpdateSession).not.toHaveBeenCalled();
      expect(mockedRefreshSessionSummary).not.toHaveBeenCalled();
      expect(mockedReplaceSessionExercises).not.toHaveBeenCalled();
    });
  });

  describe("cloneOne", () => {
    it("clones a session and refreshes summary", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2025-10-12T09:00:00.000Z"));
      setupTransaction();

      const source: SessionWithExercises = {
        id: "source-session",
        owner_id: USER_ID,
        plan_id: "plan-1",
        title: "Strength Day",
        planned_at: "2025-10-15T18:00:00.000Z",
        status: "planned",
        visibility: "private",
        notes: "Keep core tight",
        recurrence_rule: null,
        exercises: [
          {
            id: "existing-exercise",
            session_id: "source-session",
            exercise_id: "exercise-123",
            order_index: 1,
            notes: null,
            planned: {
              sets: 3,
              reps: 5,
              load: 120,
              rest: "00:02:00",
              extras: { tempo: "21X1" },
            },
            actual: null,
            sets: [
              {
                id: "existing-set-1",
                order_index: 1,
                reps: 5,
                weight_kg: 120,
                distance_m: null,
                duration_sec: null,
                rpe: 8,
                notes: null,
              },
            ],
            created_at: undefined,
            updated_at: undefined,
          },
        ],
        created_at: "2025-10-01T08:00:00.000Z",
        updated_at: "2025-10-01T08:00:00.000Z",
      };
      const cloned: SessionWithExercises = {
        ...source,
        id: "clone-session-id",
        planned_at: "2025-10-22T18:00:00.000Z",
      };

      mockedGetSessionWithDetails.mockResolvedValueOnce(source).mockResolvedValueOnce(cloned);
      mockedCreateSession.mockResolvedValue([]);
      mockedReplaceSessionExercises.mockResolvedValue();

      mockedUuid
        .mockImplementationOnce(() => "clone-exercise-1")
        .mockImplementationOnce(() => "clone-set-1")
        .mockImplementationOnce(() => "clone-session-id");

      const result = await cloneOne(USER_ID, "source-session", { date_offset_days: 7 });

      expect(mockedRefreshSessionSummary).toHaveBeenCalledTimes(1);
      expect(result).toEqual(cloned);
    });

    it("clones session including actual metrics when requested", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2025-10-12T09:00:00.000Z"));
      setupTransaction({ id: "plan-2", user_id: USER_ID });

      const source: SessionWithExercises = {
        id: "source-session",
        owner_id: USER_ID,
        plan_id: null,
        title: "Intervals",
        planned_at: "2025-10-15T07:00:00.000Z",
        status: "planned",
        visibility: "private",
        notes: null,
        recurrence_rule: null,
        exercises: [
          {
            id: "existing-exercise",
            session_id: "source-session",
            exercise_id: "exercise-123",
            order_index: 1,
            notes: null,
            planned: {
              sets: 3,
              reps: 5,
              load: 120,
              rest: "00:02:00",
              extras: { tempo: "21X1" },
            },
            actual: null,
            sets: [
              {
                id: "existing-set-1",
                order_index: 1,
                reps: 5,
                weight_kg: 120,
                distance_m: null,
                duration_sec: null,
                rpe: 8,
                notes: null,
              },
            ],
            created_at: undefined,
            updated_at: undefined,
          },
        ],
        created_at: "2025-10-01T08:00:00.000Z",
        updated_at: "2025-10-01T08:00:00.000Z",
      };
      const cloned: SessionWithExercises = {
        ...source,
        id: "clone-session-id",
        plan_id: "plan-2",
        visibility: "link",
        exercises: [
          {
            id: "existing-exercise",
            session_id: "source-session",
            exercise_id: "exercise-123",
            order_index: 1,
            notes: null,
            planned: {
              sets: 3,
              reps: 5,
              load: 120,
              rest: "00:02:00",
              extras: { tempo: "21X1" },
            },
            actual: null,
            sets: [
              {
                id: "existing-set-1",
                order_index: 1,
                reps: 5,
                weight_kg: 120,
                distance_m: null,
                duration_sec: null,
                rpe: 8,
                notes: null,
              },
            ],
            created_at: undefined,
            updated_at: undefined,
          },
        ],
      };

      mockedGetSessionWithDetails.mockResolvedValueOnce(source).mockResolvedValueOnce(cloned);
      mockedCreateSession.mockResolvedValue([]);
      mockedReplaceSessionExercises.mockResolvedValue();

      mockedUuid
        .mockImplementationOnce(() => "clone-exercise-1")
        .mockImplementationOnce(() => "clone-set-1")
        .mockImplementationOnce(() => "clone-session-id");

      const result = await cloneOne(USER_ID, "source-session", {
        date_offset_days: 2,
        include_actual: true,
        plan_id: "plan-2",
        visibility: "link",
      });

      expect(mockedRecomputeProgress).toHaveBeenCalledWith(USER_ID, "plan-2");
      expect(mockedRefreshSessionSummary).toHaveBeenCalledTimes(1);
      expect(result).toEqual(cloned);
    });
  });

  describe("applyRecurrence", () => {
    it("creates recurrence clones with offsets", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2025-10-05T09:00:00.000Z"));
      setupTransaction({ id: "plan-1", user_id: USER_ID });

      const source: SessionWithExercises = {
        id: "source-session",
        owner_id: USER_ID,
        plan_id: "plan-1",
        title: "Strength Day",
        planned_at: "2025-10-06T09:00:00.000Z",
        status: "planned",
        visibility: "private",
        notes: "Keep core tight",
        recurrence_rule: null,
        exercises: [
          {
            id: "existing-exercise",
            session_id: "source-session",
            exercise_id: "exercise-123",
            order_index: 1,
            notes: null,
            planned: {
              sets: 3,
              reps: 5,
              load: 120,
              rest: "00:02:00",
              extras: { tempo: "21X1" },
            },
            actual: null,
            sets: [
              {
                id: "existing-set-1",
                order_index: 1,
                reps: 5,
                weight_kg: 120,
                distance_m: null,
                duration_sec: null,
                rpe: 8,
                notes: null,
              },
            ],
            created_at: undefined,
            updated_at: undefined,
          },
        ],
        created_at: "2025-10-01T08:00:00.000Z",
        updated_at: "2025-10-01T08:00:00.000Z",
      };
      const cloneOneSession: SessionWithExercises = {
        ...source,
        id: "recurrence-1",
        planned_at: "2025-10-13T09:00:00.000Z",
      };
      const cloneTwoSession: SessionWithExercises = {
        ...source,
        id: "recurrence-2",
        planned_at: "2025-10-20T09:00:00.000Z",
      };

      mockedGetSessionWithDetails
        .mockResolvedValueOnce(source)
        .mockResolvedValueOnce(cloneOneSession)
        .mockResolvedValueOnce(cloneTwoSession);
      mockedCreateSession.mockResolvedValue([]);
      mockedReplaceSessionExercises.mockResolvedValue();

      mockedUuid
        .mockImplementationOnce(() => "rec-ex-1")
        .mockImplementationOnce(() => "rec-set-1")
        .mockImplementationOnce(() => "rec-session-1")
        .mockImplementationOnce(() => "rec-ex-2")
        .mockImplementationOnce(() => "rec-set-2")
        .mockImplementationOnce(() => "rec-session-2");

      const result = await applyRecurrence(USER_ID, "source-session", {
        occurrences: 2,
        offset_days: 7,
      });

      expect(mockedSessionsExistAtDates).toHaveBeenCalledWith(USER_ID, [
        "2025-10-13T09:00:00.000Z",
        "2025-10-20T09:00:00.000Z",
      ]);
      expect(mockedCreateSession).toHaveBeenCalledTimes(2);
      expect(mockedReplaceSessionExercises).toHaveBeenCalledTimes(2);
      expect(mockedRefreshSessionSummary).toHaveBeenCalledTimes(1);
      expect(mockedRecomputeProgress).toHaveBeenCalledWith(USER_ID, "plan-1");
      expect(result).toEqual([cloneOneSession, cloneTwoSession]);
    });

    it("rejects recurrence when conflicts exist", async () => {
      setupTransaction();

      const source: SessionWithExercises = {
        id: "source-session",
        owner_id: USER_ID,
        plan_id: null,
        title: "Intervals",
        planned_at: "2025-10-06T07:00:00.000Z",
        status: "planned",
        visibility: "private",
        notes: null,
        recurrence_rule: null,
        exercises: [
          {
            id: "existing-exercise",
            session_id: "source-session",
            exercise_id: "exercise-123",
            order_index: 1,
            notes: null,
            planned: {
              sets: 3,
              reps: 5,
              load: 120,
              rest: "00:02:00",
              extras: { tempo: "21X1" },
            },
            actual: null,
            sets: [
              {
                id: "existing-set-1",
                order_index: 1,
                reps: 5,
                weight_kg: 120,
                distance_m: null,
                duration_sec: null,
                rpe: 8,
                notes: null,
              },
            ],
            created_at: undefined,
            updated_at: undefined,
          },
        ],
        created_at: "2025-10-01T08:00:00.000Z",
        updated_at: "2025-10-01T08:00:00.000Z",
      };

      mockedGetSessionWithDetails.mockResolvedValueOnce(source);
      mockedSessionsExistAtDates.mockResolvedValueOnce(["2025-10-13T07:00:00.000Z"]);

      await expect(
        applyRecurrence(USER_ID, "source-session", { occurrences: 1, offset_days: 7 }),
      ).rejects.toMatchObject({
        code: "E.SESSION.RECURRENCE_CONFLICT",
        status: 409,
      });

      expect(mockedCreateSession).not.toHaveBeenCalled();
      expect(mockedRefreshSessionSummary).not.toHaveBeenCalled();
    });
  });

  describe("cancelOne", () => {
    it("rejects canceling completed sessions", async () => {
      mockedGetSessionById.mockResolvedValueOnce({
        id: SESSION_ID,
        owner_id: USER_ID,
        plan_id: null,
        planned_at: "2025-10-19T10:00:00.000Z",
        status: "completed",
        visibility: "private",
      } as Session);

      await expect(cancelOne(USER_ID, SESSION_ID)).rejects.toMatchObject({
        code: "E.SESSION.CANNOT_CANCEL_COMPLETED",
        status: 400,
      });

      expect(mockedCancelSession).not.toHaveBeenCalled();
      expect(mockedRefreshSessionSummary).not.toHaveBeenCalled();
    });

    it("cancels a planned session and refreshes summary", async () => {
      mockedGetSessionById.mockResolvedValueOnce({
        id: SESSION_ID,
        owner_id: USER_ID,
        plan_id: null,
        planned_at: "2025-10-20T10:00:00.000Z",
        status: "planned",
        visibility: "private",
      } as Session);
      mockedCancelSession.mockResolvedValueOnce(1);

      await cancelOne(USER_ID, SESSION_ID);

      expect(mockedCancelSession).toHaveBeenCalledWith(SESSION_ID, USER_ID);
      expect(mockedRefreshSessionSummary).toHaveBeenCalledTimes(1);
      expect(mockedRecomputeProgress).not.toHaveBeenCalled();
    });
  });
});

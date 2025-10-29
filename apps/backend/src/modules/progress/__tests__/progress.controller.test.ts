import type { Request, Response } from "express";
import type { ExercisesPayload, PlanProgress } from "../progress.types";

jest.mock("../progress.service", () => ({
  getSummary: jest.fn(),
  getTrends: jest.fn(),
  getExerciseBreakdown: jest.fn(),
  getPlans: jest.fn(),
  buildProgressReport: jest.fn(),
  renderProgressReportCsv: jest.fn(),
}));

const mockedService = jest.requireMock("../progress.service");

describe("progress.controller", () => {
  const USER_ID = "user-123";

  function createResponse() {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockImplementation(() => res);
    res.json = jest.fn().mockImplementation(() => res);
    res.setHeader = jest.fn().mockImplementation(() => res);
    res.send = jest.fn().mockImplementation(() => res);
    return res as Response;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("exercisesHandler", () => {
    it("returns exercise breakdown and defaults to 90-day period", async () => {
      const payload: ExercisesPayload = {
        period: 90,
        data: [
          {
            type_code: "strength",
            sessions: 4,
            total_reps: 140,
            total_volume: 10000,
            total_duration_min: 75,
          },
        ],
      };

      mockedService.getExerciseBreakdown.mockResolvedValue(payload);

      const { exercisesHandler } = await import("../progress.controller");

      const req = {
        user: { sub: USER_ID },
        query: {},
      } as unknown as Request;
      const res = createResponse();

      await exercisesHandler(req, res);

      expect(mockedService.getExerciseBreakdown).toHaveBeenCalledWith(USER_ID, 90);
      expect(res.json).toHaveBeenCalledWith(payload);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("validates query params and rejects unsupported period", async () => {
      const { exercisesHandler } = await import("../progress.controller");

      const req = {
        user: { sub: USER_ID },
        query: { period: "14" },
      } as unknown as Request;
      const res = createResponse();

      await exercisesHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.anything() }));
      expect(mockedService.getExerciseBreakdown).not.toHaveBeenCalled();
    });

    it("returns 401 when the request is unauthenticated", async () => {
      const { exercisesHandler } = await import("../progress.controller");
      const req = {
        user: undefined,
        query: {},
      } as unknown as Request;
      const res = createResponse();

      await exercisesHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockedService.getExerciseBreakdown).not.toHaveBeenCalled();
    });
  });

  describe("plansHandler", () => {
    it("returns plan progress for the current user", async () => {
      const payload: PlanProgress[] = [
        {
          id: "plan-1",
          name: "Base Build",
          progress_percent: 55,
          session_count: 12,
          completed_count: 7,
        },
      ];

      mockedService.getPlans.mockResolvedValue(payload);

      const { plansHandler } = await import("../progress.controller");

      const req = {
        user: { sub: USER_ID },
      } as unknown as Request;
      const res = createResponse();

      await plansHandler(req, res);

      expect(mockedService.getPlans).toHaveBeenCalledWith(USER_ID);
      expect(res.json).toHaveBeenCalledWith(payload);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("returns 401 for anonymous requests", async () => {
      const { plansHandler } = await import("../progress.controller");
      const req = {
        user: undefined,
      } as unknown as Request;
      const res = createResponse();

      await plansHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockedService.getPlans).not.toHaveBeenCalled();
    });
  });

  describe("exportHandler", () => {
    it("returns a JSON bundle by default", async () => {
      const report = {
        generated_at: "2025-10-21T20:00:00.000Z",
        period: 30,
        group_by: "week" as const,
        summary: {
          period: 30,
          sessions_completed: 3,
          total_reps: 47,
          total_volume: 2400,
          total_duration_min: 7.5,
          avg_volume_per_session: 800,
        },
        trends: [],
        exercises: [],
        plans: [],
      };

      mockedService.buildProgressReport.mockResolvedValue(report);

      const { exportHandler } = await import("../progress.controller");

      const req = {
        user: { sub: USER_ID },
        query: {},
      } as unknown as Request;
      const res = createResponse();

      await exportHandler(req, res);

      expect(mockedService.buildProgressReport).toHaveBeenCalledWith(USER_ID, 30, "week");
      expect(res.json).toHaveBeenCalledWith(report);
      expect(res.send).not.toHaveBeenCalled();
    });

    it("serializes the report to CSV when requested", async () => {
      const report = {
        generated_at: "2025-10-21T20:00:00.000Z",
        period: 30,
        group_by: "day" as const,
        summary: {
          period: 30,
          sessions_completed: 3,
          total_reps: 47,
          total_volume: 2400,
          total_duration_min: 7.5,
          avg_volume_per_session: 800,
        },
        trends: [],
        exercises: [],
        plans: [],
      };

      mockedService.buildProgressReport.mockResolvedValue(report);
      mockedService.renderProgressReportCsv.mockReturnValue("csv-content");

      const { exportHandler } = await import("../progress.controller");

      const req = {
        user: { sub: USER_ID },
        query: { format: "csv", period: "30", group_by: "day" },
      } as unknown as Request;
      const res = createResponse();

      await exportHandler(req, res);

      expect(mockedService.buildProgressReport).toHaveBeenCalledWith(USER_ID, 30, "day");
      expect(mockedService.renderProgressReportCsv).toHaveBeenCalledWith(report);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv");
      expect(res.send).toHaveBeenCalledWith("csv-content");
      expect(res.json).not.toHaveBeenCalled();
    });

    it("returns 401 when the export is requested anonymously", async () => {
      const { exportHandler } = await import("../progress.controller");
      const req = { user: undefined, query: {} } as unknown as Request;
      const res = createResponse();

      await exportHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockedService.buildProgressReport).not.toHaveBeenCalled();
    });
  });
});

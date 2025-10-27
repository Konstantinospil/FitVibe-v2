import type { Request, Response, NextFunction } from "express";
import { readOnlyGuard } from "../read-only.guard";
import { env } from "../../config/env";

// Mock environment
jest.mock("../../config/env", () => ({
  env: {
    readOnlyMode: false,
    maintenanceMessage: "System is temporarily in read-only mode for maintenance",
  },
}));

// Mock logger
jest.mock("../../config/logger", () => ({
  logger: {
    warn: jest.fn(),
  },
}));

describe("readOnlyGuard middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Reset environment
    (env as { readOnlyMode: boolean }).readOnlyMode = false;

    // Setup mock request
    mockReq = {
      method: "GET",
      ip: "127.0.0.1",
      user: undefined,
    };
    // Use Object.defineProperty for read-only properties
    Object.defineProperty(mockReq, "path", {
      value: "/api/v1/users",
      writable: true,
      configurable: true,
    });

    // Setup mock response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      locals: {
        requestId: "test-request-id",
      },
    };

    // Setup mock next
    mockNext = jest.fn();
  });

  describe("when read-only mode is disabled", () => {
    it("should allow GET requests", () => {
      mockReq.method = "GET";

      readOnlyGuard(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should allow POST requests", () => {
      mockReq.method = "POST";

      readOnlyGuard(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should allow PUT requests", () => {
      mockReq.method = "PUT";

      readOnlyGuard(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should allow PATCH requests", () => {
      mockReq.method = "PATCH";

      readOnlyGuard(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should allow DELETE requests", () => {
      mockReq.method = "DELETE";

      readOnlyGuard(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe("when read-only mode is enabled", () => {
    beforeEach(() => {
      (env as { readOnlyMode: boolean }).readOnlyMode = true;
    });

    it("should allow GET requests", () => {
      mockReq.method = "GET";

      readOnlyGuard(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should allow HEAD requests", () => {
      mockReq.method = "HEAD";

      readOnlyGuard(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should allow OPTIONS requests", () => {
      mockReq.method = "OPTIONS";

      readOnlyGuard(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should block POST requests", () => {
      mockReq.method = "POST";
      Object.defineProperty(mockReq, "path", {
        value: "/api/v1/sessions",
        writable: true,
        configurable: true,
      });

      readOnlyGuard(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: "E.SYSTEM.READ_ONLY",
          message: "System is temporarily in read-only mode for maintenance",
          details: {
            readOnlyMode: true,
            method: "POST",
            path: "/api/v1/sessions",
          },
          requestId: "test-request-id",
        },
      });
    });

    it("should block PUT requests", () => {
      mockReq.method = "PUT";
      Object.defineProperty(mockReq, "path", {
        value: "/api/v1/users/123",
        writable: true,
        configurable: true,
      });

      readOnlyGuard(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(503);
    });

    it("should block PATCH requests", () => {
      mockReq.method = "PATCH";

      readOnlyGuard(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(503);
    });

    it("should block DELETE requests", () => {
      mockReq.method = "DELETE";

      readOnlyGuard(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(503);
    });

    describe("always-allowed paths", () => {
      it("should allow /health even with POST", () => {
        mockReq.method = "POST";
        Object.defineProperty(mockReq, "path", {
          value: "/health",
          writable: true,
          configurable: true,
        });

        readOnlyGuard(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      it("should allow /metrics even with POST", () => {
        mockReq.method = "POST";
        Object.defineProperty(mockReq, "path", {
          value: "/metrics",
          writable: true,
          configurable: true,
        });

        readOnlyGuard(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      it("should allow /.well-known/jwks.json even with POST", () => {
        mockReq.method = "POST";
        Object.defineProperty(mockReq, "path", {
          value: "/.well-known/jwks.json",
          writable: true,
          configurable: true,
        });

        readOnlyGuard(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      it("should allow /api/v1/system/read-only/status even with POST", () => {
        mockReq.method = "POST";
        Object.defineProperty(mockReq, "path", {
          value: "/api/v1/system/read-only/status",
          writable: true,
          configurable: true,
        });

        readOnlyGuard(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      it("should allow /api/v1/system/read-only/enable even with POST", () => {
        mockReq.method = "POST";
        Object.defineProperty(mockReq, "path", {
          value: "/api/v1/system/read-only/enable",
          writable: true,
          configurable: true,
        });

        readOnlyGuard(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      it("should allow /api/v1/system/read-only/disable even with POST", () => {
        mockReq.method = "POST";
        Object.defineProperty(mockReq, "path", {
          value: "/api/v1/system/read-only/disable",
          writable: true,
          configurable: true,
        });

        readOnlyGuard(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      it("should allow /api/v1/auth/refresh even with POST", () => {
        mockReq.method = "POST";
        Object.defineProperty(mockReq, "path", {
          value: "/api/v1/auth/refresh",
          writable: true,
          configurable: true,
        });

        readOnlyGuard(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });
    });

    it("should include custom maintenance message in response", () => {
      const customMessage = "Emergency maintenance - ETA 2 hours";
      (env as { maintenanceMessage: string }).maintenanceMessage = customMessage;

      mockReq.method = "POST";

      readOnlyGuard(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: customMessage,
          }),
        }),
      );
    });

    it("should include user ID in logs if available", () => {
      const { logger } = require("../../config/logger");

      mockReq.method = "POST";
      mockReq.user = { sub: "user-123", roles: ["user"] };

      readOnlyGuard(mockReq as Request, mockRes as Response, mockNext);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
        }),
        "[read-only] Mutation request blocked",
      );
    });
  });
});

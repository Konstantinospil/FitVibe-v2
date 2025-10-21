import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import db from "../../../db/index.js";
import { incrementRefreshReuse } from "../../../observability/metrics.js";
import { listSessions, revokeSessions, refresh } from "../auth.service.js";
import type { AuthSessionRecord, RefreshTokenRecord } from "../auth.repository.js";
import type { RefreshTokenPayload } from "../auth.types.js";
import * as authRepository from "../auth.repository.js";

jest.mock("../auth.repository.js");

const repo = jest.mocked(authRepository);

jest.mock("jsonwebtoken", () => {
  const verify = jest.fn();
  const sign = jest.fn();
  return {
    __esModule: true,
    default: {
      verify,
      sign,
    },
    verify,
    sign,
  };
});

type AuditRecord = {
  action: string;
  metadata: {
    sessionId?: string | null;
    outcome?: string;
    familyRevoked?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

const makeDbResponse = () => {
  const insert = jest.fn<Promise<unknown>, [AuditRecord]>().mockResolvedValue(undefined);
  return {
    insert,
    where: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    whereNull: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockResolvedValue([]),
    first: jest.fn(),
    andWhere: jest.fn().mockReturnThis(),
    andWhereNot: jest.fn().mockReturnThis(),
    whereIn: jest.fn().mockReturnThis(),
  };
};

type DbResponse = ReturnType<typeof makeDbResponse>;

jest.mock("../../../db/index.js", () => {
  const dbMock = jest.fn(() => makeDbResponse());
  return {
    __esModule: true,
    default: dbMock,
  };
});

jest.mock("../../../observability/metrics.js", () => ({
  incrementRefreshReuse: jest.fn(),
}));

const jwtMock = jwt as unknown as { verify: jest.Mock; sign: jest.Mock };
const dbMock = db as unknown as jest.Mock<DbResponse>;
const incrementRefreshReuseMock = incrementRefreshReuse as jest.MockedFunction<
  typeof incrementRefreshReuse
>;

describe("auth.service session helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("marks the current session when listing", async () => {
    const now = new Date().toISOString();
    const baseSession: AuthSessionRecord = {
      jti: "current",
      user_id: "user-1",
      user_agent: "Chrome",
      ip: "10.0.0.1",
      created_at: now,
      expires_at: now,
      revoked_at: null,
      last_active_at: now,
    };
    const otherSession: AuthSessionRecord = {
      ...baseSession,
      jti: "other",
      user_agent: "Safari",
      ip: "10.0.0.2",
    };
    repo.listSessionsByUserId.mockResolvedValue([baseSession, otherSession]);

    const sessions = await listSessions("user-1", "current");

    expect(sessions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "current", isCurrent: true }),
        expect.objectContaining({ id: "other", isCurrent: false }),
      ]),
    );
    expect(repo.listSessionsByUserId).toHaveBeenCalledWith("user-1");
  });

  it("revokes other sessions when requested", async () => {
    const now = new Date().toISOString();
    const current: AuthSessionRecord = {
      jti: "current",
      user_id: "user-1",
      user_agent: null,
      ip: null,
      created_at: now,
      expires_at: now,
      revoked_at: null,
      last_active_at: now,
    };
    const old: AuthSessionRecord = { ...current, jti: "old" };
    repo.listSessionsByUserId.mockResolvedValue([current, old]);
    repo.revokeSessionsByUserId.mockResolvedValue(1);
    repo.revokeRefreshByUserExceptSession.mockResolvedValue(1);

    const result = await revokeSessions("user-1", {
      revokeOthers: true,
      currentSessionId: "current",
      context: { requestId: "req-1" },
    });

    expect(result.revoked).toBe(1);
    expect(repo.revokeSessionsByUserId).toHaveBeenCalledWith("user-1", "current");
    expect(repo.revokeRefreshByUserExceptSession).toHaveBeenCalledWith("user-1", "current");
  });

  it("throws if requesting to revoke others without a current session id", async () => {
    await expect(
      revokeSessions("user-1", { revokeOthers: true, currentSessionId: null }),
    ).rejects.toThrow("Current session id required");
  });
});

describe("auth.service refresh", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("revokes the session family and emits audit when a refresh token is reused", async () => {
    const refreshToken = "reused-token";
    const tokenHash = createHash("sha256").update(refreshToken).digest("hex");
    const historical: RefreshTokenRecord = {
      id: "token-1",
      user_id: "user-1",
      token_hash: tokenHash,
      session_jti: "session-1",
      expires_at: new Date(Date.now() + 60_000).toISOString(),
      created_at: new Date(Date.now() - 120_000).toISOString(),
      revoked_at: new Date(Date.now() - 60_000).toISOString(),
    };

    repo.getRefreshByHash.mockResolvedValue(undefined);
    repo.findRefreshTokenRaw.mockResolvedValue(historical);
    repo.revokeSessionById.mockResolvedValue(1);
    repo.revokeRefreshBySession.mockResolvedValue(1);

    const decoded: RefreshTokenPayload = {
      sub: "user-1",
      sid: "session-1",
      typ: "refresh",
    };
    jwtMock.verify.mockReturnValue(decoded);

    await expect(
      refresh(refreshToken, {
        requestId: "req-123",
        ip: "203.0.113.5",
        userAgent: "jest-agent",
      }),
    ).rejects.toMatchObject({ status: 401, code: "AUTH_INVALID_REFRESH" });

    expect(repo.revokeSessionById).toHaveBeenCalledWith("session-1");
    expect(repo.revokeRefreshBySession).toHaveBeenCalledWith("session-1");
    expect(incrementRefreshReuseMock).toHaveBeenCalledTimes(1);

    const auditInsertCalls = dbMock.mock.results.flatMap((result) => {
      const value = result.value as DbResponse | undefined;
      if (!value) {
        return [];
      }
      return value.insert.mock.calls;
    });

    const reuseAuditEntry = auditInsertCalls.find(
      ([payload]) => payload.action === "auth.refresh_reuse",
    );

    expect(reuseAuditEntry).toBeDefined();
    const payload = reuseAuditEntry?.[0];
    expect(payload?.action).toBe("auth.refresh_reuse");
    expect(payload?.metadata).toEqual(
      expect.objectContaining({
        sessionId: "session-1",
        outcome: "failure",
        familyRevoked: true,
      }),
    );
  });
});

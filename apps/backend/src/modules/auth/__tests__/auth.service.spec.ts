import { listSessions, revokeSessions } from "../auth.service.js";
import type { AuthSessionRecord } from "../auth.repository.js";
import * as authRepository from "../auth.repository.js";

jest.mock("../auth.repository.js");

const repo = jest.mocked(authRepository);

jest.mock("../../../db/index.js", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    insert: jest.fn(),
    where: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    whereNull: jest.fn().mockReturnThis(),
    first: jest.fn(),
    orderBy: jest.fn().mockResolvedValue([]),
  })),
}));

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

import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { apiClient, rawHttpClient } from "../src/services/api";
import { useAuthStore } from "../src/store/auth.store";

describe("apiClient authentication flow", () => {
  let apiMock: MockAdapter;
  let rawMock: MockAdapter;

  beforeEach(() => {
    apiMock = new MockAdapter(apiClient);
    rawMock = new MockAdapter(rawHttpClient);
    useAuthStore.getState().signOut();
    localStorage.clear();
  });

  afterEach(() => {
    apiMock.restore();
    rawMock.restore();
  });

  it("attaches the bearer token when available", async () => {
    useAuthStore.getState().signIn({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    apiMock.onGet("/api/protected").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer access-token");
      return [200, { ok: true }];
    });

    const response = await apiClient.get("/api/protected");

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ ok: true });
  });

  it("refreshes the session on the first 401", async () => {
    useAuthStore.getState().signIn({
      accessToken: "expired-token",
      refreshToken: "refresh-token",
    });

    let callCount = 0;

    apiMock.onGet("/api/protected").reply((config) => {
      callCount += 1;
      if (callCount === 1) {
        return [401];
      }

      expect(config.headers?.Authorization).toBe("Bearer fresh-token");
      return [200, { ok: true }];
    });

    rawMock.onPost("/auth/refresh").reply(200, {
      accessToken: "fresh-token",
      refreshToken: "new-refresh-token",
    });

    const response = await apiClient.get("/api/protected");

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ ok: true });
    expect(callCount).toBe(2);
    expect(useAuthStore.getState().accessToken).toBe("fresh-token");
    expect(useAuthStore.getState().refreshToken).toBe("new-refresh-token");
  });

  it("signs out when refresh fails", async () => {
    useAuthStore.getState().signIn({
      accessToken: "expired-token",
      refreshToken: "refresh-token",
    });

    apiMock.onGet("/api/protected").reply(401);
    rawMock.onPost("/auth/refresh").reply(400);

    await expect(apiClient.get("/api/protected")).rejects.toBeDefined();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
  });
});

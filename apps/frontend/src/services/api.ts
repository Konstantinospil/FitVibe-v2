import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import axios from "axios";
import { useAuthStore } from "../store/auth.store";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

type RefreshTokensResponse = {
  accessToken: string;
  refreshToken: string;
};

export type HealthStatusResponse = {
  status: string;
};

const baseConfig = {
  baseURL: API_URL,
  timeout: 15000,
  withCredentials: true,
};

export const apiClient = axios.create(baseConfig);

// Separate client without interceptors to avoid circular refresh attempts.
export const rawHttpClient = axios.create(baseConfig);

let isRefreshing = false;

type QueueEntry = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  config: RetryableRequestConfig;
};

const refreshQueue: QueueEntry[] = [];

const enqueueRequest = (config: RetryableRequestConfig) =>
  new Promise((resolve, reject) => {
    refreshQueue.push({ resolve, reject, config });
  });

const processQueue = (error: unknown, token: string | null) => {
  while (refreshQueue.length > 0) {
    const { resolve, reject, config } = refreshQueue.shift() as QueueEntry;
    if (error || !token) {
      reject(error ?? new Error("Unable to refresh authentication token"));
      continue;
    }

    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;

    apiClient(config).then(resolve).catch(reject);
  }
};

const requestTokenRefresh = async (): Promise<RefreshTokensResponse> => {
  const { refreshToken } = useAuthStore.getState();

  if (!refreshToken) {
    throw new Error("Missing refresh token");
  }

  const response = await rawHttpClient.post<RefreshTokensResponse>("/auth/refresh", {
    refreshToken,
  });

  return response.data;
};

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();

  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const { response, config } = error;
    const originalRequest = config as RetryableRequestConfig | undefined;

    if (!originalRequest || !response) {
      return Promise.reject(error);
    }

    if (response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const { refreshToken } = useAuthStore.getState();

    if (!refreshToken) {
      useAuthStore.getState().signOut();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return enqueueRequest(originalRequest);
    }

    isRefreshing = true;

    try {
      const tokens = await requestTokenRefresh();
      useAuthStore.getState().setTokens(tokens);

      processQueue(null, tokens.accessToken);

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().signOut();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export async function getHealthStatus(): Promise<HealthStatusResponse> {
  const res = await apiClient.get<HealthStatusResponse>("/api/health");
  return res.data;
}

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  name: string;
};

export async function login(payload: LoginRequest): Promise<RefreshTokensResponse> {
  const res = await rawHttpClient.post<RefreshTokensResponse>("/auth/login", payload);
  return res.data;
}

export async function register(payload: RegisterRequest): Promise<RefreshTokensResponse> {
  const res = await rawHttpClient.post<RefreshTokensResponse>("/auth/register", payload);
  return res.data;
}

export type DashboardRange = "4w" | "8w";
export type DashboardGrain = "weekly" | "monthly";

export type DashboardSummaryMetric = {
  id: string;
  label: string;
  value: string | number;
  trend?: string;
};

export type DashboardPersonalRecord = {
  lift: string;
  value: string;
  achieved: string;
  visibility: "public" | "link" | "private";
};

export type DashboardAggregateRow = {
  period: string;
  volume: number;
  sessions: number;
};

export type DashboardAnalyticsMeta = {
  range: DashboardRange;
  grain: DashboardGrain;
  totalRows: number;
  truncated: boolean;
};

export type DashboardAnalyticsResponse = {
  summary: DashboardSummaryMetric[];
  personalRecords: DashboardPersonalRecord[];
  aggregates: DashboardAggregateRow[];
  meta: DashboardAnalyticsMeta;
};

type RawDashboardAnalyticsResponse = Omit<DashboardAnalyticsResponse, "meta"> & {
  meta?: Partial<DashboardAnalyticsMeta>;
};

const MAX_ANALYTIC_ROWS = 5;

export async function getDashboardAnalytics(params: {
  range: DashboardRange;
  grain: DashboardGrain;
}): Promise<DashboardAnalyticsResponse> {
  const res = await apiClient.get<RawDashboardAnalyticsResponse>("/analytics/dashboard", {
    params,
  });

  const raw = res.data;
  const aggregates = (raw.aggregates ?? []).slice(0, MAX_ANALYTIC_ROWS);
  const totalRows = raw.aggregates?.length ?? aggregates.length;
  const truncated = totalRows > aggregates.length || raw.meta?.truncated === true;

  return {
    summary: raw.summary ?? [],
    personalRecords: raw.personalRecords ?? [],
    aggregates,
    meta: {
      range: raw.meta?.range ?? params.range,
      grain: raw.meta?.grain ?? params.grain,
      totalRows,
      truncated,
    },
  };
}

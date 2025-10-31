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
      return Promise.reject(
        refreshError instanceof Error ? refreshError : new Error(String(refreshError)),
      );
    } finally {
      isRefreshing = false;
    }
  },
);

export async function getHealthStatus(): Promise<HealthStatusResponse> {
  const res = await apiClient.get<HealthStatusResponse>("/health");
  return res.data;
}

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  username: string;
  profile?: {
    display_name?: string;
  };
};

export async function login(payload: LoginRequest): Promise<RefreshTokensResponse> {
  const res = await rawHttpClient.post<RefreshTokensResponse>("/api/v1/auth/login", payload);
  return res.data;
}

export async function register(payload: RegisterRequest): Promise<RefreshTokensResponse> {
  const res = await rawHttpClient.post<RefreshTokensResponse>("/api/v1/auth/register", payload);
  return res.data;
}

export type ForgotPasswordRequest = {
  email: string;
};

export type ForgotPasswordResponse = {
  message: string;
};

export async function forgotPassword(
  payload: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  const res = await rawHttpClient.post<ForgotPasswordResponse>(
    "/api/v1/auth/password/forgot",
    payload,
  );
  return res.data;
}

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
};

export type ResetPasswordResponse = {
  message: string;
};

export async function resetPassword(
  payload: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
  const res = await rawHttpClient.post<ResetPasswordResponse>(
    "/api/v1/auth/password/reset",
    payload,
  );
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

const MAX_ANALYTIC_ROWS = 5;

export async function getDashboardAnalytics(params: {
  range: DashboardRange;
  grain: DashboardGrain;
}): Promise<DashboardAnalyticsResponse> {
  // Call the actual progress endpoints
  const period = params.range === "4w" ? 30 : 60;
  const groupBy = params.grain === "weekly" ? "week" : "day";

  const [summaryRes, trendsRes] = await Promise.all([
    apiClient.get<ProgressSummary>("/api/v1/progress/summary", { params: { period } }),
    apiClient.get<TrendDataPoint[]>("/api/v1/progress/trends", {
      params: { period, group_by: groupBy },
    }),
  ]);

  const summary = summaryRes.data;
  const trends = trendsRes.data;

  // Transform backend data to dashboard format
  const summaryMetrics: DashboardSummaryMetric[] = [
    {
      id: "streak",
      label: "Training streak",
      value: summary.currentStreak ? `${summary.currentStreak} days` : "0 days",
      trend: summary.streakChange
        ? `${summary.streakChange > 0 ? "+" : ""}${summary.streakChange} vs last period`
        : "",
    },
    {
      id: "sessions",
      label: "Sessions completed",
      value: summary.totalSessions?.toString() || "0",
      trend: summary.sessionsChange
        ? `${summary.sessionsChange > 0 ? "+" : ""}${summary.sessionsChange} vs last period`
        : "",
    },
    {
      id: "volume",
      label: "Total volume",
      value: summary.totalVolume ? `${(summary.totalVolume / 1000).toFixed(1)}k kg` : "0 kg",
      trend: summary.volumeChange
        ? `${summary.volumeChange > 0 ? "+" : ""}${(summary.volumeChange / 1000).toFixed(1)}k kg vs last period`
        : "",
    },
  ];

  const personalRecords: DashboardPersonalRecord[] = (summary.personalRecords || [])
    .slice(0, 3)
    .map((pr) => ({
      lift: pr.exerciseName || "Unknown",
      value: pr.value ? `${pr.value} ${pr.unit || "kg"}` : "-",
      achieved: pr.achievedAt || "Unknown",
      visibility: (pr.visibility as "public" | "link" | "private") || "private",
    }));

  const aggregates: DashboardAggregateRow[] = (trends || [])
    .slice(0, MAX_ANALYTIC_ROWS)
    .map((row, index: number) => ({
      period: row.label || `Week ${index + 1}`,
      volume: row.volume,
      sessions: row.sessions,
    }));

  return {
    summary: summaryMetrics,
    personalRecords,
    aggregates,
    meta: {
      range: params.range,
      grain: params.grain,
      totalRows: trends?.length || 0,
      truncated: trends?.length > MAX_ANALYTIC_ROWS,
    },
  };
}

// Feed API
export interface FeedItem {
  id: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
  };
  session: {
    id: string;
    title?: string;
    notes?: string;
    plannedAt: string;
    completedAt?: string;
    exerciseCount: number;
    totalVolume?: number;
  };
  visibility: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
}

export interface FeedResponse {
  items: FeedItem[];
  total: number;
}

export async function getFeed(
  params: { scope?: string; limit?: number; offset?: number } = {},
): Promise<FeedResponse> {
  const res = await apiClient.get<FeedResponse>("/api/v1/feed", { params });
  return res.data;
}

export async function likeFeedItem(feedItemId: string): Promise<void> {
  await apiClient.post(`/api/v1/feed/item/${feedItemId}/like`);
}

export async function unlikeFeedItem(feedItemId: string): Promise<void> {
  await apiClient.delete(`/api/v1/feed/item/${feedItemId}/like`);
}

export async function cloneSessionFromFeed(sessionId: string): Promise<{ sessionId: string }> {
  const res = await apiClient.post<{ sessionId: string }>(
    `/api/v1/feed/session/${sessionId}/clone`,
  );
  return res.data;
}

// Progress API
export interface ProgressSummary {
  totalSessions: number;
  totalVolume: number;
  currentStreak: number;
  personalRecords?: Array<{
    exerciseName: string;
    value: number;
    unit: string;
    achievedAt: string;
    visibility: string;
  }>;
  streakChange?: number;
  sessionsChange?: number;
  volumeChange?: number;
}

export interface TrendDataPoint {
  label: string;
  date: string;
  volume: number;
  sessions: number;
  avgIntensity: number;
}

export interface ExerciseStats {
  exerciseId: string;
  exerciseName: string;
  totalSessions: number;
  totalVolume: number;
  avgVolume: number;
  maxWeight: number;
  trend: "up" | "down" | "stable";
}

export interface ExerciseBreakdown {
  exercises: ExerciseStats[];
  period: number;
}

export async function getProgressSummary(period: number = 30): Promise<ProgressSummary> {
  const res = await apiClient.get<ProgressSummary>("/api/v1/progress/summary", {
    params: { period },
  });
  return res.data;
}

export async function getProgressTrends(params: {
  period?: number;
  group_by?: "day" | "week";
  from?: string; // ISO date string
  to?: string; // ISO date string
}): Promise<TrendDataPoint[]> {
  const res = await apiClient.get<TrendDataPoint[]>("/api/v1/progress/trends", { params });
  return res.data;
}

export async function getExerciseBreakdown(params: {
  period?: number;
  from?: string; // ISO date string
  to?: string; // ISO date string
}): Promise<ExerciseBreakdown> {
  const res = await apiClient.get<ExerciseBreakdown>("/api/v1/progress/exercises", { params });
  return res.data;
}

export async function exportProgress(): Promise<Blob> {
  const res = await apiClient.get<Blob>("/api/v1/progress/export", {
    responseType: "blob",
  });
  return res.data;
}

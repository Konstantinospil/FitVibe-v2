import { useQuery } from "@tanstack/react-query";
import type { DashboardAnalyticsResponse, DashboardGrain, DashboardRange } from "../services/api";
import { getDashboardAnalytics } from "../services/api";

export interface UseDashboardAnalyticsOptions {
  range: DashboardRange;
  grain: DashboardGrain;
}

export function useDashboardAnalytics({ range, grain }: UseDashboardAnalyticsOptions) {
  return useQuery<DashboardAnalyticsResponse>({
    queryKey: ["analytics", "dashboard", range, grain],
    queryFn: () => getDashboardAnalytics({ range, grain }),
    keepPreviousData: true,
  });
}

import { useQuery } from "@tanstack/react-query";
import { getHealthStatus } from "../services/api";

export const HEALTH_STATUS_QUERY_KEY = ["health-status"] as const;

export function useHealthStatus() {
  return useQuery({
    queryKey: HEALTH_STATUS_QUERY_KEY,
    queryFn: async () => {
      const response = await getHealthStatus();
      return response.status;
    },
    refetchInterval: 20_000,
    staleTime: 15_000,
  });
}

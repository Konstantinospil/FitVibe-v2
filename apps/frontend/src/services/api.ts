import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

type HealthStatusResponse = {
  status: string;
};

export async function getHealthStatus(): Promise<HealthStatusResponse> {
  const res = await axios.get<HealthStatusResponse>(`${API_URL}/api/health`);
  return res.data;
}

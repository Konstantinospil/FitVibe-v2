import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function getHealthStatus() {
  const res = await axios.get(`${API_URL}/api/health`);
  return res.data;
}
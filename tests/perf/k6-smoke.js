import http from "k6/http";
import { check } from "k6";

export const options = {
  scenarios: {
    sustain: {
      executor: "constant-arrival-rate",
      rate: 500,
      timeUnit: "1s",
      duration: "1m",
      preAllocatedVUs: 100,
      maxVUs: 500,
    },
    burst: {
      executor: "ramping-arrival-rate",
      startRate: 100,
      timeUnit: "1s",
      stages: [
        { target: 1000, duration: "30s" },
        { target: 0, duration: "10s" }
      ],
      preAllocatedVUs: 200,
      maxVUs: 600,
      startTime: "1m",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<300"],
    http_req_failed: ["rate<0.001"],
  },
};

export default function () {
  const target = __ENV.API_BASE_URL || "http://127.0.0.1:4173/health";
  const response = http.get(target);
  check(response, {
    "status is 200": (res) => res.status === 200,
  });
}

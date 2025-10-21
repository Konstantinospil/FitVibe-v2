/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

const metricsFile = path.resolve(process.cwd(), "apps/backend/src/observability/metrics.ts");

const REQUIRED_METRICS = ["http_request_duration_seconds", "http_requests_total"];

const REQUIRED_LABELS = ["method", "route", "status_code"];
const REQUIRED_BUCKETS = ["0.05", "0.1", "0.2", "0.5", "1", "2", "5"];

function fileContainsAll(haystack, needles) {
  return needles.every((needle) => haystack.includes(needle));
}

function main() {
  const contents = fs.readFileSync(metricsFile, "utf8");

  for (const metric of REQUIRED_METRICS) {
    if (!contents.includes(`"${metric}"`)) {
      console.error(`Missing Prometheus metric "${metric}" in metrics middleware.`);
      process.exit(1);
    }
  }

  if (
    !fileContainsAll(
      contents,
      REQUIRED_LABELS.map((l) => `"${l}"`),
    )
  ) {
    console.error("Metrics middleware must expose labels method, route, status_code.");
    process.exit(1);
  }

  if (
    !fileContainsAll(
      contents,
      REQUIRED_BUCKETS.map((b) => `${b}`),
    )
  ) {
    console.error("Histogram buckets must include 0.05, 0.1, 0.2, 0.5, 1, 2, 5 seconds.");
    process.exit(1);
  }

  console.log("Prometheus metrics contract verified.");
}

main();

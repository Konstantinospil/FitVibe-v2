/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

const summaryPath = process.argv[2];

if (!summaryPath) {
  console.error("Usage: node tests/perf/assert-budgets.js <summary.json>");
  process.exit(1);
}

const resolved = path.resolve(process.cwd(), summaryPath);

if (!fs.existsSync(resolved)) {
  console.error(`k6 summary not found at ${resolved}`);
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(resolved, "utf8"));

function ensureThreshold(metricName, threshold) {
  const metric = summary.metrics?.[metricName];
  if (!metric) {
    console.error(`Missing metric "${metricName}" in k6 summary.`);
    process.exit(1);
  }
  const thresholdRecord = metric.thresholds?.[threshold];
  if (!thresholdRecord) {
    console.error(
      `Missing threshold "${threshold}" for metric "${metricName}".`,
    );
    process.exit(1);
  }
  if (!(thresholdRecord.ok === true || thresholdRecord.ok === "true")) {
    console.error(
      `Threshold "${threshold}" for metric "${metricName}" breached. Actual: ${thresholdRecord.actual}`,
    );
    process.exit(1);
  }
}

ensureThreshold("http_req_duration", "p(95)<300");
ensureThreshold("http_req_failed", "rate<0.001");

console.log("k6 performance budgets satisfied.");

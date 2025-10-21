/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

const envExamplePath = path.resolve(process.cwd(), ".env.example");

const REQUIRED_FLAGS = ["FEATURE_SOCIAL_FEED", "FEATURE_COACH_DASHBOARD", "FEATURE_INSIGHTS"];

function main() {
  const contents = fs.readFileSync(envExamplePath, "utf8");
  const missing = [];
  const misconfigured = [];

  for (const flag of REQUIRED_FLAGS) {
    const regex = new RegExp(`^${flag}=([^\\r\\n]+)`, "m");
    const match = contents.match(regex);
    if (!match) {
      missing.push(flag);
      continue;
    }
    const value = match[1].trim().toLowerCase();
    if (value !== "false") {
      misconfigured.push({ flag, value });
    }
  }

  if (missing.length > 0 || misconfigured.length > 0) {
    if (missing.length > 0) {
      console.error(`Missing feature flag defaults in .env.example: ${missing.join(", ")}`);
    }
    if (misconfigured.length > 0) {
      for (const issue of misconfigured) {
        console.error(`Feature flag ${issue.flag} must default to "false" but is "${issue.value}"`);
      }
    }
    process.exit(1);
  }

  console.log("Feature flag defaults verified.");
}

main();

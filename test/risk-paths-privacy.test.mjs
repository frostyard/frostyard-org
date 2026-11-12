// The files that hold or guard the privacy and /stats/ promises must be at L1,
// so a PR that changes them gets risk:high (AGENTS.md "Risk paths").
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { levelOfFile } from "../scripts/lib/risk-paths.mjs";

const PROMISE_PATHS = [
  "src/pages/privacy/index.astro",
  "src/pages/privacy/problem-reports.astro",
  "public/_redirects",
  "src/data/privacy-contact.mjs",
  "src/data/problem-report-descriptions.mjs",
  "src/lib/problem-report-table.mjs",
  "src/components/ProblemReportTable.astro",
  "src/lib/problem-stats.mjs",
  "scripts/sync-problem-stats.mjs",
  "src/pages/stats.astro",
  "scripts/lib/problem-page-checks.mjs",
];

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const listPath = join(root, ".github", "risk-paths.json");
const readList = () => JSON.parse(readFileSync(listPath, "utf8"));

test("every promise file exists", () => {
  const missing = PROMISE_PATHS.filter((path) => !existsSync(join(root, path)));
  assert.deepEqual(missing, []);
});

test("every promise file is at L1", () => {
  const list = readList();
  const notL1 = PROMISE_PATHS.filter((path) => levelOfFile(list, path).level !== "L1");
  assert.deepEqual(notL1, []);
});

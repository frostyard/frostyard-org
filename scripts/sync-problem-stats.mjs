// Refresh the weekly problem statistics snapshot from report.frostyard.org.
//
// The stats page builds from the committed snapshot so a build stays
// network-independent. This script runs in prebuild and replaces the snapshot
// with the published answer, after validating it against the schema copy and
// the rules in frostyard/problem-intake docs/specs/stats.md. On any error it
// keeps the committed snapshot, so a site build never depends on the service
// being up.
import { readFile, writeFile } from "node:fs/promises";

import { validateStats } from "../src/lib/problem-stats.mjs";

const source = "https://report.frostyard.org/v1/stats";
const output = new URL("../src/data/problem-stats.json", import.meta.url);
const schemaUrl = new URL("../public/schemas/problem-report/v1.json", import.meta.url);

try {
  const schema = JSON.parse(await readFile(schemaUrl, "utf8"));
  const response = await fetch(source, { signal: AbortSignal.timeout(8000), headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`it answered ${response.status}`);
  const stats = validateStats(await response.json(), schema);
  const snapshot = { source, fetchedAt: new Date().toISOString(), stats };
  await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Synced the problem statistics snapshot (${stats.weeks.length} weeks).`);
} catch (error) {
  console.warn(`Could not refresh the problem statistics (${error.message}); using the committed snapshot.`);
  // Prove that the fallback exists and parses; a broken snapshot must fail the build.
  JSON.parse(await readFile(output, "utf8"));
}

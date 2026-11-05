// Copy the pinned problem report schema from frostyard/core into public/schemas.
//
// The published bytes must match the pin in src/data/problem-report-schema-pin.json
// exactly. A mismatch means either the pin or the upstream file changed, and the
// copy would no longer be the schema that senders were built against. This is a
// manual command (npm run sync:problem-schema), not part of the build.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const pinUrl = new URL("../src/data/problem-report-schema-pin.json", import.meta.url);
const output = new URL("../public/schemas/problem-report/v1.json", import.meta.url);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fail(message) {
  console.error(`sync-problem-schema: ${message}`);
  process.exitCode = 1;
}

const pin = JSON.parse(await readFile(pinUrl, "utf8"));
for (const key of ["repository", "commit", "path", "sha256"]) {
  if (typeof pin[key] !== "string" || pin[key] === "") {
    fail(`the pin has no ${key}.`);
    process.exit();
  }
}

const url = `https://raw.githubusercontent.com/${pin.repository}/${pin.commit}/${pin.path}`;

let bytes;
try {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`the download answered ${response.status}`);
  bytes = Buffer.from(await response.arrayBuffer());
} catch (error) {
  fail(`could not download ${url} (${error.message}).`);
  process.exit();
}

const digest = sha256(bytes);
if (digest !== pin.sha256) {
  fail(`${pin.repository}@${pin.commit}:${pin.path} has sha256 ${digest}, but the pin says ${pin.sha256}. The copy was not written.`);
  process.exit();
}

await mkdir(new URL("../public/schemas/problem-report/", import.meta.url), { recursive: true });
await writeFile(output, bytes);
console.log(`Synced public/schemas/problem-report/v1.json from ${pin.repository}@${pin.commit} (sha256 ${digest}).`);

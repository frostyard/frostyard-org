// Guard for core docs/specs/risk-paths.md section B, which the validator does not check.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const CATEGORIES = [
  "boot chain",
  "signing and keys",
  "update verification",
  "auth",
  "publication",
  "secrets and credentials",
  "rulesets and settings",
  "destructive operations",
  "governance",
];

function badCategories(list) {
  const bad = [];
  for (const entry of list.paths) {
    const why = typeof entry?.why === "string" ? entry.why : "";
    if (!CATEGORIES.some((category) => why.startsWith(`${category}: `))) {
      bad.push(entry?.glob);
    }
  }
  return bad;
}

const here = dirname(fileURLToPath(import.meta.url));

test("every why starts with a listed category", () => {
  const list = JSON.parse(readFileSync(join(here, "..", ".github", "risk-paths.json"), "utf8"));
  assert.deepEqual(badCategories(list), []);
});

test("an unlisted category is reported by glob", () => {
  const fixture = {
    schema_version: 1,
    paths: [
      { glob: "a", why: "governance: x" },
      { glob: "b", why: "deploy: y" },
    ],
  };
  assert.deepEqual(badCategories(fixture), ["b"]);
});

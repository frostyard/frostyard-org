// Guard for core docs/specs/risk-paths.md section B (categories) and section C
// (rule C levels in a version 2 list), which the validator does not check.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { checkRequiredPaths } from "../scripts/lib/risk-paths.mjs";

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
  const v2 = list.schema_version === 2;
  for (const entry of list.paths) {
    if (v2 && (entry?.level === "L3" || entry?.level === "L4")) continue;
    const why = typeof entry?.why === "string" ? entry.why : "";
    if (!CATEGORIES.some((category) => why.startsWith(`${category}: `))) {
      bad.push(entry?.glob);
    }
  }
  return bad;
}

const here = dirname(fileURLToPath(import.meta.url));
const listPath = join(here, "..", ".github", "risk-paths.json");

test("every why starts with a listed category", () => {
  const list = JSON.parse(readFileSync(listPath, "utf8"));
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

test("a version 2 list frees the why of an L3 or L4 entry only", () => {
  const fixture = {
    schema_version: 2,
    default_level: "L3",
    paths: [
      { glob: "docs/**", level: "L3", why: "how-to documentation" },
      { glob: "a", level: "L2", why: "governance: x" },
      { glob: "b", level: "L2", why: "deploy: y" },
    ],
  };
  assert.deepEqual(badCategories(fixture), ["b"]);
});

test("the list and the caller are at L1 or L2 in a version 2 list", () => {
  const list = JSON.parse(readFileSync(listPath, "utf8"));
  assert.deepEqual(
    checkRequiredPaths(list, [".github/risk-paths.json", ".github/workflows/risk-paths.yml"]),
    [],
  );
});

test("a caller glob at L3 gives an error from checkRequiredPaths", () => {
  const fixture = {
    schema_version: 2,
    default_level: "L3",
    paths: [
      { glob: ".github/risk-paths.json", level: "L2", why: "governance: the list" },
      { glob: ".github/workflows/risk-paths.yml", level: "L3", why: "the caller" },
    ],
  };
  const errors = checkRequiredPaths(fixture, [
    ".github/risk-paths.json",
    ".github/workflows/risk-paths.yml",
  ]);
  assert.ok(errors.length > 0, "expected at least 1 error");
});

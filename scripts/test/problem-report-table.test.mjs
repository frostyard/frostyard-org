import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { reportTable } from "../../src/lib/problem-report-table.mjs";
import { completeDescriptions } from "./fixtures/problem-report-descriptions.mjs";

const schema = JSON.parse(await readFile(new URL("../../public/schemas/problem-report/v1.json", import.meta.url), "utf8"));

function descriptions() {
  return completeDescriptions(schema);
}

test("the report table follows the schema order and required arrays", () => {
  const table = reportTable(schema, descriptions());

  assert.deepEqual(table.envelope.map((row) => row.field), [
    "schema",
    "report_id",
    "week",
    "image.id",
    "image.version",
    "secure",
    "client",
    "kind",
  ]);
  assert.deepEqual(table.envelope[0].values, ["frostyard.problem/1"]);
  assert.deepEqual(table.envelope[3].values, ["snow", "snowfield", "sundog", "floe"]);
  assert.equal(table.envelope[1].values, null);
  assert.ok(table.envelope.every((row) => row.required));

  assert.deepEqual(table.kinds.map((kind) => kind.kind), schema.properties.kind.enum);
  const crash = table.kinds.find((kind) => kind.kind === "crash");
  assert.deepEqual(crash.fields.map((row) => row.field), ["exe", "package", "package_version", "signal"]);
  assert.deepEqual(crash.fields.map((row) => row.required), [true, false, false, true]);
  assert.deepEqual(crash.fields[3].values, ["SIGSEGV", "SIGABRT", "SIGBUS", "SIGILL", "SIGFPE", "SIGTRAP", "SIGSYS", "other"]);

  assert.deepEqual(table.appIds, schema.$defs.app_problem.properties.app_id.enum);
});

test("a complete description map passes", () => {
  // The map is complete by construction, so this only checks that nothing in
  // the schema is left without a description in the builder.
  assert.doesNotThrow(() => reportTable(schema, descriptions()));
});

test("a missing kind throws with the kind name", () => {
  const map = descriptions();
  delete map.kinds.tpm_unlock;
  assert.throws(() => reportTable(schema, map), /tpm_unlock/);
});

test("a missing field throws with the field name", () => {
  const map = descriptions();
  delete map.kinds.app_problem.fields.frames;
  assert.throws(() => reportTable(schema, map), /frames/);
});

test("a missing envelope field throws with the field name", () => {
  const map = descriptions();
  delete map.envelope["image.version"];
  assert.throws(() => reportTable(schema, map), /image\.version/);
});

test("an empty description throws with the item name", () => {
  const fieldMap = descriptions();
  fieldMap.kinds.crash.fields.exe = "   ";
  assert.throws(() => reportTable(schema, fieldMap), /exe/);

  const envelopeMap = descriptions();
  envelopeMap.envelope.week = "";
  assert.throws(() => reportTable(schema, envelopeMap), /week/);

  const titleMap = descriptions();
  titleMap.kinds.count.title = " ";
  assert.throws(() => reportTable(schema, titleMap), /count/);

  const purposeMap = descriptions();
  purposeMap.kinds.count.purpose = "";
  assert.throws(() => reportTable(schema, purposeMap), /count/);
});

test("a stale kind throws with its name", () => {
  const map = descriptions();
  map.kinds.removed_kind = { title: "Gone", purpose: "Gone.", fields: {} };
  assert.throws(() => reportTable(schema, map), /removed_kind/);
});

test("a stale field throws with its name", () => {
  const map = descriptions();
  map.kinds.crash.fields.core_dump = "Not in the schema.";
  assert.throws(() => reportTable(schema, map), /core_dump/);

  const envelopeMap = descriptions();
  envelopeMap.envelope.detail = "The detail object is not an envelope field.";
  assert.throws(() => reportTable(schema, envelopeMap), /detail/);
});

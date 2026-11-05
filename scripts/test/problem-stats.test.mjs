import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { statsView, validateStats } from "../../src/lib/problem-stats.mjs";

const schema = JSON.parse(await readFile(new URL("../../public/schemas/problem-report/v1.json", import.meta.url), "utf8"));

// A document that follows docs/specs/stats.md: no published number is from 1
// to 4, and a hidden count is null.
function indexDocument() {
  return {
    schema: "frostyard.problem-stats-index/1",
    weeks: ["2026-W44", "2026-W45"],
    latest: {
      schema: "frostyard.problem-stats/1",
      week: "2026-W45",
      min_cell: 5,
      tables: {
        reports: {
          group_by: "image",
          cell_by: "kind",
          total: 84,
          groups: {
            snow: { total: 51, cells: { crash: 9, unit_failed: 42 } },
            floe: { total: null, cells: { tpm_unlock: null } },
          },
        },
        app_problems: {
          group_by: "app_id",
          cell_by: "class",
          total: null,
          groups: { "org.frostyard.nsl": { total: null, cells: { panic: null, error: null } } },
        },
        installs: {
          group_by: "image",
          cell_by: "image_version",
          total: 99,
          groups: { snow: { total: 99, cells: { "20260901000000": 99 } } },
        },
      },
    },
  };
}

function snapshot(stats = indexDocument()) {
  return { source: "https://report.frostyard.org/v1/stats", fetchedAt: "2026-11-09T05:41:00.000Z", stats };
}

test("a valid statistics document passes", () => {
  const document = indexDocument();
  assert.equal(validateStats(document, schema), document);
  const wrapped = snapshot();
  assert.equal(validateStats(wrapped, schema), wrapped);
});

test("a published cell of 1, 2, 3 or 4 throws", () => {
  for (const small of [1, 2, 3, 4]) {
    const document = indexDocument();
    document.latest.tables.reports.groups.snow.cells.crash = small;
    assert.throws(() => validateStats(document, schema), /crash/, `a cell of ${small} must throw.`);
  }
});

test("a published total of 3 throws", () => {
  const tableTotal = indexDocument();
  tableTotal.latest.tables.installs.total = 3;
  assert.throws(() => validateStats(tableTotal, schema), /installs\.total/);

  const groupTotal = indexDocument();
  groupTotal.latest.tables.reports.groups.snow.total = 3;
  assert.throws(() => validateStats(groupTotal, schema), /snow\.total/);
});

test("an unknown kind throws with its name", () => {
  const document = indexDocument();
  document.latest.tables.reports.groups.snow.cells.app_problem = 9;
  assert.throws(() => validateStats(document, schema), /app_problem/);
});

test("an unknown app ID throws with its name", () => {
  const document = indexDocument();
  document.latest.tables.app_problems.groups["org.example.Other"] = { total: null, cells: { panic: null } };
  assert.throws(() => validateStats(document, schema), /org\.example\.Other/);
});

test("a bad image version throws with its name", () => {
  const document = indexDocument();
  document.latest.tables.installs.groups.snow.cells["2026-09-01"] = 9;
  assert.throws(() => validateStats(document, schema), /2026-09-01/);
});

test("an extra key throws at every level", () => {
  const top = indexDocument();
  top.note = "extra";
  assert.throws(() => validateStats(top, schema), /note/);

  const week = indexDocument();
  week.latest.note = "extra";
  assert.throws(() => validateStats(week, schema), /latest.*note|note/);

  const group = indexDocument();
  group.latest.tables.reports.groups.snow.note = "extra";
  assert.throws(() => validateStats(group, schema), /note/);

  const cell = indexDocument();
  cell.latest.tables.reports.groups.snow.cells.crash = { count: 9 };
  assert.throws(() => validateStats(cell, schema), /crash/);
});

test("a latest week outside the week list throws", () => {
  const document = indexDocument();
  document.weeks = ["2026-W44"];
  assert.throws(() => validateStats(document, schema), /2026-W45/);
});

test("a null latest gives the empty view", () => {
  const view = statsView(snapshot({ schema: "frostyard.problem-stats-index/1", weeks: [], latest: null }), schema);
  assert.deepEqual(view, { empty: true, fetchedAt: "2026-11-09T05:41:00.000Z" });

  assert.deepEqual(statsView(snapshot(null), schema), { empty: true, fetchedAt: "2026-11-09T05:41:00.000Z" });
});

test("the view carries the week, the week count, and 1 entry for each table", () => {
  const view = statsView(snapshot(), schema);
  assert.equal(view.week, "2026-W45");
  assert.equal(view.weekCount, 2);
  assert.equal(view.fetchedAt, "2026-11-09T05:41:00.000Z");
  assert.deepEqual(view.tables.map((table) => table.name), ["reports", "app_problems", "installs"]);

  const reports = view.tables[0];
  assert.equal(reports.total, 84);
  assert.equal(reports.groupBy, "image");
  assert.deepEqual(reports.rows.map((row) => row.key), ["floe", "snow"]);
  const floe = reports.rows[0];
  assert.equal(floe.total, null);
  assert.deepEqual(floe.cells.find((cell) => cell.key === "tpm_unlock"), { key: "tpm_unlock", value: null });
  assert.deepEqual(floe.cells.find((cell) => cell.key === "crash"), { key: "crash", value: 0 });

  const installs = view.tables[2];
  assert.deepEqual(installs.columns, ["20260901000000"]);
});

test("the committed snapshot is valid", async () => {
  const committed = JSON.parse(await readFile(new URL("../../src/data/problem-stats.json", import.meta.url), "utf8"));
  assert.equal(validateStats(committed, schema), committed);
  assert.equal(statsView(committed, schema).empty, true);
});

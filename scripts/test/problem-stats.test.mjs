import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { statsView, validateStats } from "../../src/lib/problem-stats.mjs";

const schema = JSON.parse(await readFile(new URL("../../public/schemas/problem-report/v1.json", import.meta.url), "utf8"));

// A document that follows docs/specs/stats.md: no published number is from 1
// to 4, and every hidden count keeps 2 possible values.
// reports: snow (published) plus 2 hidden group totals, so the table total has
// room above their lower bounds.
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
            floe: { total: null, cells: { integrity_error: null, tpm_unlock: null } },
            sundog: { total: null, cells: { crash: null, unit_failed: null } },
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

// The same document with 1 table replaced, for the equation tests.
function documentWithTable(name, table) {
  const document = indexDocument();
  document.latest.tables[name] = table;
  return document;
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
    document.latest.tables.reports.groups.snow.cells.integrity_error = small;
    assert.throws(() => validateStats(document, schema), /integrity_error/, `a cell of ${small} must throw.`);
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
  assert.deepEqual(reports.rows.map((row) => row.key), ["floe", "snow", "sundog"]);
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

test("a published total beside 1 hidden cell is rejected", () => {
  // The cross-review example: 10 - 9 = 1, so the hidden cell is known.
  const document = documentWithTable("reports", {
    group_by: "image",
    cell_by: "kind",
    total: 10,
    groups: { snow: { total: 10, cells: { crash: 9, unit_failed: null } } },
  });
  assert.throws(() => validateStats(document, schema), /1 hidden cell/);

  const other = documentWithTable("reports", {
    group_by: "image",
    cell_by: "kind",
    total: 20,
    groups: { snow: { total: 20, cells: { crash: 15, unit_failed: null } } },
  });
  assert.throws(() => validateStats(other, schema), /1 hidden cell/);
});

test("a published table total beside 1 hidden group total is rejected", () => {
  const document = documentWithTable("reports", {
    group_by: "image",
    cell_by: "kind",
    total: 60,
    groups: {
      snow: { total: 30, cells: { crash: 30 } },
      floe: { total: null, cells: { crash: null, unit_failed: null } },
    },
  });
  assert.throws(() => validateStats(document, schema), /1 hidden group total/);
});

test("a hidden cell set with no slack is rejected", () => {
  // 10 - 8 = 2 for 2 hidden cells: each would be exactly 1.
  const document = documentWithTable("reports", {
    group_by: "image",
    cell_by: "kind",
    total: 10,
    groups: { snow: { total: 10, cells: { crash: 8, tpm_unlock: null, integrity_error: null } } },
  });
  assert.throws(() => validateStats(document, schema), /slack/);
});

test("a published total that is not the sum of its cells is rejected", () => {
  const document = documentWithTable("reports", {
    group_by: "image",
    cell_by: "kind",
    total: 20,
    groups: { snow: { total: 20, cells: { crash: 5, unit_failed: 6, tpm_unlock: 7 } } },
  });
  assert.throws(() => validateStats(document, schema), /sum of its cells/);

  const tableSum = documentWithTable("reports", {
    group_by: "image",
    cell_by: "kind",
    total: 40,
    groups: {
      snow: { total: 51, cells: { crash: 9, unit_failed: 42 } },
      floe: { total: 20, cells: { crash: 20 } },
    },
  });
  assert.throws(() => validateStats(tableSum, schema), /sum of the group totals/);
});

test("a table total below the lower bounds of hidden groups is rejected", () => {
  // Each hidden total must hold at least 2, so a table total of 25 leaves no room.
  const below = documentWithTable("reports", {
    group_by: "image",
    cell_by: "kind",
    total: 25,
    groups: {
      snow: { total: 22, cells: { crash: 22 } },
      floe: { total: null, cells: { crash: null, unit_failed: null } },
      sundog: { total: null, cells: { crash: null, unit_failed: null } },
    },
  });
  assert.throws(() => validateStats(below, schema), /cannot be below/);

  // 30 leaves the 2 hidden totals at exactly their lower bound: each could be found.
  const noSlack = documentWithTable("reports", {
    group_by: "image",
    cell_by: "kind",
    total: 30,
    groups: {
      snow: { total: 26, cells: { crash: 26 } },
      floe: { total: null, cells: { crash: null, unit_failed: null } },
      sundog: { total: null, cells: { crash: null, unit_failed: null } },
    },
  });
  assert.throws(() => validateStats(noSlack, schema), /slack above the hidden group totals/);
});

test("a correct document with hidden cells passes", () => {
  // reports: snow 42 published + 2 hidden cells with slack (51 - 42 = 9, so 9 - 2 >= 1);
  // floe: 2 hidden cells at the lower bound 2, in a group whose total is hidden.
  const document = documentWithTable("reports", {
    group_by: "image",
    cell_by: "kind",
    total: null,
    groups: {
      snow: { total: 51, cells: { unit_failed: 42, crash: null, tpm_unlock: null } },
      floe: { total: null, cells: { crash: null, integrity_error: null } },
    },
  });
  assert.doesNotThrow(() => validateStats(document, schema));
});

test("a document where every count is hidden passes", () => {
  const document = indexDocument();
  document.latest.tables = {
    reports: {
      group_by: "image",
      cell_by: "kind",
      total: null,
      groups: { snow: { total: null, cells: { crash: null, unit_failed: null } } },
    },
    app_problems: {
      group_by: "app_id",
      cell_by: "class",
      total: null,
      groups: { "org.frostyard.nsl": { total: null, cells: { panic: null } } },
    },
    installs: {
      group_by: "image",
      cell_by: "image_version",
      total: null,
      groups: { snow: { total: null, cells: { "20260901000000": null } } },
    },
  };
  assert.doesNotThrow(() => validateStats(document, schema));
});

test("an empty table is valid and a group with no cell is not", () => {
  const empty = {
    reports: { group_by: "image", cell_by: "kind", total: 0, groups: {} },
    app_problems: { group_by: "app_id", cell_by: "class", total: 0, groups: {} },
    installs: { group_by: "image", cell_by: "image_version", total: 99, groups: { snow: { total: 99, cells: { "20260901000000": 99 } } } },
  };
  const document = indexDocument();
  document.latest.tables = empty;
  assert.doesNotThrow(() => validateStats(document, schema));

  const noCells = indexDocument();
  noCells.latest.tables.reports.groups.floe = { total: null, cells: {} };
  assert.throws(() => validateStats(noCells, schema), /at least 1 cell/);

  const zeroTotalWithGroups = indexDocument();
  zeroTotalWithGroups.latest.tables.reports.total = 0;
  assert.throws(() => validateStats(zeroTotalWithGroups, schema), /0 while the table has groups/);
});

test("a hidden group total beside only published cells is rejected", () => {
  // The hidden total is 9 + 42 = 51.
  const document = documentWithTable("reports", {
    group_by: "image",
    cell_by: "kind",
    total: null,
    groups: {
      snow: { total: null, cells: { crash: 9, unit_failed: 42 } },
      floe: { total: null, cells: { crash: null, unit_failed: null } },
    },
  });
  assert.throws(() => validateStats(document, schema), /every cell is published/);
});

test("a hidden table total beside only published group totals is rejected", () => {
  // The hidden table total is 51 + 99 = 150.
  const document = documentWithTable("reports", {
    group_by: "image",
    cell_by: "kind",
    total: null,
    groups: {
      snow: { total: 51, cells: { crash: 9, unit_failed: 42 } },
      floe: { total: 99, cells: { crash: 99 } },
    },
  });
  assert.throws(() => validateStats(document, schema), /every group total is published/);
});

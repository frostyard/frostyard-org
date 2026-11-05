import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { reportTable } from "../../src/lib/problem-report-table.mjs";
import { validateStats } from "../../src/lib/problem-stats.mjs";
import { checkPrivacyPage, checkStatsPage } from "../lib/problem-page-checks.mjs";
import descriptions from "../../src/data/problem-report-descriptions.mjs";

const schema = JSON.parse(await readFile(new URL("../../public/schemas/problem-report/v1.json", import.meta.url), "utf8"));

function row(item) {
  const values = (item.values ?? []).map((value) => `<code>${value}</code>`).join(", ");
  const field = item.required ? "" : " (optional)";
  return `<tr><td><code>${item.field}</code>${field}</td><td>${item.description}</td><td>${values}</td></tr>`;
}

// The markup that src/components/ProblemReportTable.astro renders, built from
// the real schema copy and the real description map.
function privacyHtml() {
  const table = reportTable(schema, descriptions);
  const envelope = `<table><caption class="sr-only">Values</caption><tbody>${table.envelope.map(row).join("")}</tbody></table>`;
  const kinds = table.kinds
    .map(
      (kind) =>
        `<section class="kind"><h3 id="kind-${kind.kind}">${kind.title} <code>${kind.kind}</code></h3><p>${kind.purpose}</p><table><tbody>${kind.fields
          .map(row)
          .join("")}</tbody></table></section>`,
    )
    .join("");
  return `<article>${envelope}${kinds}</article>`;
}

// Remove 1 field row from the part of 1 kind, and nowhere else.
function withoutRow(html, kind, field) {
  const parts = html.split('<section class="kind">');
  const index = parts.findIndex((part) => part.includes(`id="kind-${kind}"`));
  assert.notEqual(index, -1, `The fixture must have the kind ${kind}.`);
  const before = parts[index];
  parts[index] = before.replace(new RegExp(`<tr><td><code>${field}</code>.*?</tr>`), "");
  assert.notEqual(parts[index], before, `The fixture must have the row ${field} in ${kind}.`);
  return parts.join('<section class="kind">');
}

function statsSnapshot(latest) {
  return {
    source: "https://report.frostyard.org/v1/stats",
    fetchedAt: "2026-11-09T05:41:00.000Z",
    stats: { schema: "frostyard.problem-stats-index/1", weeks: latest === null ? [] : ["2026-W45"], latest },
  };
}

// A week that follows docs/specs/stats.md, with 1 hidden cell and 2 hidden
// group totals, and 1 empty table.
function weekDocument() {
  return {
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
      app_problems: { group_by: "app_id", cell_by: "class", total: 0, groups: {} },
      installs: {
        group_by: "image",
        cell_by: "image_version",
        total: 99,
        groups: { snow: { total: 99, cells: { "20260901000000": 99 } } },
      },
    },
  };
}

function statsHtml(latest) {
  if (latest === null) return '<article><p class="no-data">No data yet.</p></article>';
  const cell = (value) => (value === null ? '<td data-stat="hidden">hidden</td>' : value === 0 ? "<td>0</td>" : `<td data-stat="${value}">${value}</td>`);
  const sections = [];
  for (const name of ["reports", "app_problems", "installs"]) {
    const table = latest.tables[name];
    const cells = [];
    for (const group of Object.values(table.groups)) {
      for (const value of Object.values(group.cells)) cells.push(value);
      cells.push(group.total);
    }
    cells.push(table.total);
    const total = table.total === null ? "hidden" : String(table.total);
    sections.push(`<section class="stats-table" data-stats-table="${name}" data-table-total="${total}">${cells.map(cell).join("")}</section>`);
  }
  return `<article>${sections.join("")}</article>`;
}

test("a privacy page with every row passes", () => {
  assert.deepEqual(checkPrivacyPage(privacyHtml(), schema), []);
});

test("a missing row that 2 kinds share fails and names the kind", () => {
  // error_class stays in update_stage_failed, so a page-wide check would pass.
  const errors = checkPrivacyPage(withoutRow(privacyHtml(), "sysext_update_failed", "error_class"), schema);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /sysext_update_failed/);
  assert.match(errors[0], /error_class/);
});

test("a missing row named like a kind fails", () => {
  const errors = checkPrivacyPage(withoutRow(privacyHtml(), "integrity_error", "count"), schema);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /integrity_error/);
});

test("a missing app ID fails and names it", () => {
  const html = privacyHtml().replace("<code>org.frostyard.nsl</code>", "");
  const errors = checkPrivacyPage(html, schema);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /org\.frostyard\.nsl/);
});

test("a stats page that renders every count passes", () => {
  const latest = weekDocument();
  assert.deepEqual(checkStatsPage(statsHtml(latest), statsSnapshot(latest)), []);
});

test("a week where every count is hidden passes", () => {
  // Each table: 1 group with 1 small cell, so the cell, the group total and
  // the table total are all hidden.
  const latest = weekDocument();
  latest.tables.reports = { group_by: "image", cell_by: "kind", total: null, groups: { snow: { total: null, cells: { crash: null } } } };
  latest.tables.app_problems = { group_by: "app_id", cell_by: "class", total: null, groups: { "org.frostyard.nsl": { total: null, cells: { panic: null } } } };
  latest.tables.installs = { group_by: "image", cell_by: "image_version", total: null, groups: { snow: { total: null, cells: { "20260901000000": null } } } };
  const snapshot = statsSnapshot(latest);
  validateStats(snapshot, schema);
  const html = statsHtml(latest);
  const rendered = [...html.matchAll(/data-stat="([^"]*)"/g)].map((match) => match[1]);
  assert.ok(rendered.length > 0);
  assert.ok(rendered.every((value) => value === "hidden"));
  assert.deepEqual(checkStatsPage(html, snapshot), []);
});

test("a week where every table is empty passes, and a page without its tables fails", () => {
  const latest = weekDocument();
  for (const [name, axes] of Object.entries({ reports: ["image", "kind"], app_problems: ["app_id", "class"], installs: ["image", "image_version"] })) {
    latest.tables[name] = { group_by: axes[0], cell_by: axes[1], total: 0, groups: {} };
  }
  const snapshot = statsSnapshot(latest);
  validateStats(snapshot, schema);
  assert.deepEqual(checkStatsPage(statsHtml(latest), snapshot), []);
  const errors = checkStatsPage("<h1>Statistics</h1>", snapshot);
  assert.equal(errors.length, 3);
  assert.match(errors.join(" "), /app_problems/);
});

test("a stats page that misses an empty table fails", () => {
  const latest = weekDocument();
  const html = statsHtml(latest).replace(/<section[^>]*data-stats-table="app_problems"[\s\S]*?<\/section>/, "");
  const errors = checkStatsPage(html, statsSnapshot(latest));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /app_problems/);
});

test("an empty snapshot passes with the no-data line", () => {
  assert.deepEqual(checkStatsPage(statsHtml(null), statsSnapshot(null)), []);
  assert.match(checkStatsPage("<p>Counts below.</p>", statsSnapshot(null)).join(" "), /No data yet/);
});

test("a stats page that misses 1 count fails", () => {
  const latest = weekDocument();
  const html = statsHtml(latest).replace('<td data-stat="42">42</td>', "");
  const errors = checkStatsPage(html, statsSnapshot(latest));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /does not render/);
});

test("a stats page that renders a small count fails", () => {
  const latest = weekDocument();
  const html = statsHtml(latest).replace('<td data-stat="9">9</td>', '<td data-stat="3">3</td>');
  const errors = checkStatsPage(html, statsSnapshot(latest));
  assert.match(errors.join(" "), /data-stat="3"/);
});

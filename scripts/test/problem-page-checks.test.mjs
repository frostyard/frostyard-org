import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { reportTable } from "../../src/lib/problem-report-table.mjs";
import { validateStats } from "../../src/lib/problem-stats.mjs";
import { checkPrivacyPage, checkPublicBugReports, checkStatsPage, publicBugReportsCutoff } from "../lib/problem-page-checks.mjs";
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

// The markup of the public bug reports section, copied from the built
// /privacy/problem-reports/ page. It holds the statistics part before the
// section, the section itself, and the rights part, because the check reads the
// links that the statistics part and the rights part make to the section.
function publicBugReportsHtml() {
  const rows = [
    ["app_problem", "<code>app_id</code>, <code>runtime</code>, <code>component</code>, and <code>code</code> (class <code>error</code>) or <code>frames</code> or <code>location</code> (class <code>panic</code>)"],
    ["unit_failed", "<code>unit</code>, <code>result</code>"],
    ["update_stage_failed", "<code>error_class</code>, <code>target_version</code>"],
    ["booted_older_image", "<code>how</code>, <code>newer_version</code>"],
    ["sysext_update_failed", "<code>feature</code>, <code>outcome</code>, <code>error_class</code> if the report has it, and the newest checked extension <code>version</code>, shown as <code>feature_version</code>, if there is one"],
    ["tpm_unlock", "<code>outcome</code>, <code>tpm_rc</code>, the variant"],
    ["integrity_error", "<code>subsystem</code>, the variant"],
  ]
    .map(([kind, fields]) => `<tr><td><code>${kind}</code></td><td>${fields}</td></tr>`)
    .join("");
  return `<article>
<h2 id="public-statistics">Public statistics</h2>
<p>We publish weekly totals on the <a href="/stats/">statistics page</a>. A number from 1 to 4 is never published, and neither is a number that would let you work one out from the totals. We never publish single reports. The 1-to-4 rule covers the statistics: a <a href="#public-bug-reports">public bug report</a> holds no count, but it exists only because 1 or more reports came in.</p>
<h2 id="public-bug-reports">Public bug reports</h2>
<p>Anyone can read these issues: <a href="https://github.com/search?q=org%3Afrostyard+label%3Aproblem-report&amp;type=issues">list every public bug report</a>. <code>crash</code> and <code>count</code> reports never open an issue.</p>
<h3 id="public-bug-reports-holds">What an issue holds</h3>
<ul>
<li>The kind and the class of the problem.</li>
<li>The newest version that the job checked: the app version for an app problem, else each image with its newest image version. Never a list of versions.</li>
<li>The fields of its kind in the table below, and no other field.</li>
<li>A problem key: a short hash of the published values only.</li>
<li>The numbers of the matching issues in our GlitchTip. These are GlitchTip's own issue numbers, not report IDs.</li>
<li>Later comments from the job hold only fixed text, a marker, and the fix releases and versions that it checked.</li>
</ul>
<table><thead><tr><th scope="col">Kind</th><th scope="col">Fields in the issue</th></tr></thead><tbody>${rows}</tbody></table>
<h3 id="public-bug-reports-never">What an issue never holds</h3>
<p>No issue, comment or status of the job holds:</p>
<ul>
<li>a <code>report_id</code>, an event ID, a <code>week</code> or a <code>client</code>;</li>
<li>any count: no number of reports, no <code>count</code> bucket, no <code>retries</code>;</li>
<li>any day;</li>
<li><code>bootc_version</code>, <code>shipped</code>, or <code>secure</code> outside the 2 kinds above;</li>
<li>a host name, a user name, a path on your computer, or free text.</li>
</ul>
<h3 id="public-bug-reports-residue">What an issue still tells</h3>
<p>An issue tells that 1 or more computers with reporting turned on sent a report with these values. Its creation time tells about when the first report came. A rare image and version can point to the few computers that run it.</p>
<h3 id="public-bug-reports-cutoff">Which faults are filed</h3>
<p>The job files only faults that our GlitchTip first saw on or after <time datetime="2026-11-20">20 November 2026</time>, 00:00 UTC. A fault first seen before then is never filed.</p>
<h3 id="public-bug-reports-deletion">Deletion and turning reporting off</h3>
<p>Deleting a report, or turning reporting off, does not remove, change or close an issue.</p>
<h2 id="your-rights">Your rights</h2>
<ul>
<li><strong>Consent.</strong> Consent is the legal basis for reports.</li>
<li><strong>Delete a report.</strong> Send us its <code>report_id</code> and we delete that report. A <a href="#public-bug-reports">public bug report</a> also stays.</li>
</ul>
<h2 id="source">Source</h2>
<ul>
<li><a href="https://github.com/frostyard/core/blob/ed1fcbde60c63fcacd39d0e0db725f0b40e56a88/docs/adr/0074-publish-verified-fault-records-as-public-issues.md">Public bug reports</a>: frostyard/core ADR-0074.</li>
<li><a href="https://github.com/frostyard/problem-intake/blob/main/docs/specs/triage.md">The triage job</a>.</li>
</ul>
</article>`;
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

// A table after the last kind must not stand in for a row that the last kind
// lost, so a kind part stops at the next <h2.
test("a kind part of the privacy page stops at the next heading", () => {
  const html = `${withoutRow(privacyHtml(), "count", "channel")}<h2 id="after">After</h2><table><tbody><tr><td><code>channel</code></td><td><code>stable</code></td></tr></tbody></table>`;
  const errors = checkPrivacyPage(html, schema);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /count/);
  assert.match(errors[0], /channel/);
});

test("a public bug reports section that keeps its promises passes", () => {
  assert.deepEqual(checkPublicBugReports(publicBugReportsHtml()), []);
});

test("publicBugReportsCutoff returns the date the page states", () => {
  assert.equal(publicBugReportsCutoff(publicBugReportsHtml()), "2026-11-20");
});

test("a page without the public bug reports id fails", () => {
  const html = publicBugReportsHtml().replace('<h2 id="public-bug-reports">', '<h2 id="public-bug-reports-x">');
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /id public-bug-reports/);
});

test("a page with 2 public bug reports ids fails", () => {
  const html = publicBugReportsHtml().replace("</article>", '<div id="public-bug-reports"></div></article>');
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /2 elements/);
});

test("a kind row that names a field outside code fails", () => {
  const html = publicBugReportsHtml().replace("<code>frames</code>", "frames");
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /frames/);
});

test("a table row for a kind that never opens an issue fails", () => {
  const html = publicBugReportsHtml().replace("</tbody>", "<tr><td><code>crash</code></td><td><code>exe</code></td></tr></tbody>");
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /crash/);
});

test("a held item that is missing fails", () => {
  const html = publicBugReportsHtml().replace(" Never a list of versions.", "");
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /Never a list of versions/);
});

test("a never item that is missing fails", () => {
  const html = publicBugReportsHtml().replace("<code>retries</code>", "retries");
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /retries/);
});

test("a missing kind row fails and names the kind", () => {
  const fixture = publicBugReportsHtml();
  const html = fixture.replace("<tr><td><code>unit_failed</code></td><td><code>unit</code>, <code>result</code></td></tr>", "");
  assert.notEqual(html, fixture);
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /unit_failed/);
});

test("a tpm_unlock row without the variant fails", () => {
  const fixture = publicBugReportsHtml();
  const html = fixture.replace("<code>tpm_rc</code>, the variant</td>", "<code>tpm_rc</code></td>");
  assert.notEqual(html, fixture);
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /tpm_unlock/);
  assert.match(errors[0], /the variant/);
});

test("a sysext row without feature_version fails", () => {
  const fixture = publicBugReportsHtml();
  const html = fixture.replace(", shown as <code>feature_version</code>", "");
  assert.notEqual(html, fixture);
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /feature_version/);
});

test("a held version item without its newest-checked prefix fails", () => {
  const fixture = publicBugReportsHtml();
  const html = fixture.replace("The newest version that the job checked: the app version", "The app version");
  assert.notEqual(html, fixture);
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /The newest version that the job checked/);
});

test("a held version item without its detail fails", () => {
  const fixture = publicBugReportsHtml();
  const html = fixture.replace("the app version for an app problem, else each image with its newest image version", "");
  assert.notEqual(html, fixture);
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /the app version for an app problem/);
});

test("a held GlitchTip item without its first part fails", () => {
  const fixture = publicBugReportsHtml();
  const html = fixture.replace("The numbers of the matching issues in our GlitchTip", "");
  assert.notEqual(html, fixture);
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /The numbers of the matching issues/);
});

test("a held GlitchTip item without its limit fails", () => {
  const fixture = publicBugReportsHtml();
  const html = fixture.replace("These are GlitchTip's own issue numbers, not report IDs", "");
  assert.notEqual(html, fixture);
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /not report IDs/);
});

test("a never held line that is missing fails", () => {
  const fixture = publicBugReportsHtml();
  const html = fixture.replace("a host name, ", "");
  assert.notEqual(html, fixture);
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /a host name/);
});

test("a never held limit that is missing fails", () => {
  const fixture = publicBugReportsHtml();
  const html = fixture.replace(" outside the 2 kinds above", "");
  assert.notEqual(html, fixture);
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /outside the 2 kinds above/);
});

test("a page without the triage link fails", () => {
  const fixture = publicBugReportsHtml();
  const html = fixture.replace('<a href="https://github.com/frostyard/problem-intake/blob/main/docs/specs/triage.md">The triage job</a>', "The triage job");
  assert.notEqual(html, fixture);
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /triage/);
});

test("a cutoff without the UTC time fails", () => {
  const fixture = publicBugReportsHtml();
  const html = fixture.replace(", 00:00 UTC", "");
  assert.notEqual(html, fixture);
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /00:00 UTC/);
});

test("a cutoff with 2 time elements fails", () => {
  const fixture = publicBugReportsHtml();
  const html = fixture.replace("</time>, 00:00 UTC", '</time> <time datetime="2026-11-21"></time>, 00:00 UTC');
  assert.notEqual(html, fixture);
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /2 time elements/);
  assert.equal(publicBugReportsCutoff(html), null);
});

test("a missing sentence of the section fails", () => {
  const html = publicBugReportsHtml().replace(" A rare image and version can point to the few computers that run it.", "");
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /A rare image and version/);
});

test("a cutoff without a time element fails", () => {
  const html = publicBugReportsHtml().replace('<time datetime="2026-11-20">20 November 2026</time>', "20 November 2026");
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /0 time elements/);
  assert.equal(publicBugReportsCutoff(html), null);
});

test("a cutoff date that is not on the calendar fails", () => {
  const html = publicBugReportsHtml().replace('datetime="2026-11-20"', 'datetime="2026-02-30"');
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /2026-02-30/);
  assert.equal(publicBugReportsCutoff(html), null);
});

test("an ADR-0074 link on blob/main fails", () => {
  const html = publicBugReportsHtml().replace("blob/ed1fcbde60c63fcacd39d0e0db725f0b40e56a88/", "blob/main/");
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /ADR-0074/);
});

test("a page without the issue search link fails", () => {
  const html = publicBugReportsHtml().replace('<a href="https://github.com/search?q=org%3Afrostyard+label%3Aproblem-report&amp;type=issues">list every public bug report</a>', "list every public bug report");
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /every public bug report/);
});

test("a statistics part without the link to the section fails", () => {
  const html = publicBugReportsHtml().replace('<a href="#public-bug-reports">public bug report</a> holds no count', "public bug report holds no count");
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /public statistics part/);
});

test("a Delete a report item without the link to the section fails", () => {
  const html = publicBugReportsHtml().replace('A <a href="#public-bug-reports">public bug report</a> also stays.', "A public bug report also stays.");
  const errors = checkPublicBugReports(html);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /Delete a report/);
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

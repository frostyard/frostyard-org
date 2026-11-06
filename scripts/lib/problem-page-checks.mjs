// Pure page checks for the problem report pages, so they can be tested on a
// fixture instead of a build.
//
// The privacy page must show every field of the schema in the part of the page
// that belongs to it. A field appears in more than 1 kind (`error_class`,
// `outcome`, `version`, and `count`, which is also a kind name), so a check
// over the whole page would pass while 1 kind silently loses a row. The stats
// page must show exactly the counts that the validated snapshot allows: a
// number from 1 to 4, or a count that should be hidden, must never render.
//
// The privacy page also has a public bug reports section, which promises which
// values a public GitHub issue may hold and which it never holds. That section
// is checked here too, on the built HTML only, so a text edit that drops a
// promise fails the site check.

const TABLE_NAMES = ["reports", "app_problems", "installs"];

// The closed list of the kinds that a public bug report can hold, and the
// fields that an issue may show for each one, from frostyard/core ADR-0074.
// A new kind or a new field is a change to that ADR, not a change to the page.
const PUBLIC_BUG_REPORT_FIELDS = [
  { kind: "app_problem", fields: ["app_id", "runtime", "component", "code", "frames", "location"], says: [] },
  { kind: "unit_failed", fields: ["unit", "result"], says: [] },
  { kind: "update_stage_failed", fields: ["error_class", "target_version"], says: [] },
  { kind: "booted_older_image", fields: ["how", "newer_version"], says: [] },
  { kind: "sysext_update_failed", fields: ["feature", "outcome", "error_class", "version", "feature_version"], says: [] },
  { kind: "tpm_unlock", fields: ["outcome", "tpm_rc"], says: ["the variant"] },
  { kind: "integrity_error", fields: ["subsystem"], says: ["the variant"] },
];

// The kinds that never open a public issue, so the table must have no row for
// them. A row for a kind outside the closed list above is also an error.
const PUBLIC_BUG_REPORT_REFUSED = ["crash", "count"];

// The values that the "never holds" part must name in code.
const PUBLIC_BUG_REPORT_NEVER = ["report_id", "week", "client", "count", "retries", "bootc_version", "shipped", "secure"];

// What the "never holds" part must say in its own words.
const PUBLIC_BUG_REPORT_NEVER_SAYS = [
  "an event ID",
  "any count",
  "no number of reports",
  "any day",
  "a host name",
  "a user name",
  "a path on your computer",
  "free text",
  "outside the 2 kinds above",
];

// The held items that the "holds" part must state.
const PUBLIC_BUG_REPORT_HOLDS_SAYS = [
  "The kind and the class of the problem",
  "The newest version that the job checked: the app version for an app problem, else each image with its newest image version.",
  "Never a list of versions",
  "A problem key: a short hash of the published values only",
  "The numbers of the matching issues in our GlitchTip",
  "These are GlitchTip's own issue numbers, not report IDs",
  "Later comments from the job hold only fixed text, a marker, and the fix releases and versions that it checked",
];

// The sentences of the section that must stay word for word, because each one is
// a promise to the reader about what a public issue tells.
const PUBLIC_BUG_REPORT_SAYS = [
  "An issue tells that 1 or more computers with reporting turned on sent a report with these values.",
  "Its creation time tells about when the first report came.",
  "A rare image and version can point to the few computers that run it.",
  "A fault first seen before then is never filed.",
  "Deleting a report, or turning reporting off, does not remove, change or close an issue.",
];

// ADR-0074 at a commit, so the page cites the text it states. `blob/main` would
// change under the page.
const ADR_0074 = /^https:\/\/github\.com\/frostyard\/core\/blob\/[0-9a-f]{40}\/docs\/adr\/0074-publish-verified-fault-records-as-public-issues\.md$/;
const ISSUE_SEARCH = "https://github.com/search?q=org%3Afrostyard+label%3Aproblem-report&amp;type=issues";
const TRIAGE_SPEC = "https://github.com/frostyard/problem-intake/blob/main/docs/specs/triage.md";

function textOf(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// The first-column cells of the field tables: a <td> whose first child is the
// <code> element that names the field.
function fieldNames(part) {
  return [...part.matchAll(/<td\b[^>]*>\s*<code\b[^>]*>([^<]+)<\/code>/g)].map((match) => match[1].trim());
}

// Every top-level property but `detail`, with the image object flattened to
// its 2 leaf fields. This is the same envelope the report table renders.
function envelopeFields(schema) {
  const fields = [];
  for (const [name, property] of Object.entries(schema?.properties ?? {})) {
    if (name === "detail") continue;
    if (name === "image") {
      for (const leaf of Object.keys(property?.properties ?? {})) fields.push(`image.${leaf}`);
      continue;
    }
    fields.push(name);
  }
  return fields;
}

// A kind part ends at the next kind or at the next <h2, whichever comes first,
// so a table after the last kind (the public bug reports table) cannot stand in
// for a field row that the last kind lost.
function kindParts(html) {
  const parts = new Map();
  const starts = [...html.matchAll(/id="kind-([^"]+)"/g)];
  for (const [index, match] of starts.entries()) {
    const start = match.index ?? 0;
    const heading = html.slice(start).search(/<h2\b/);
    const ends = [starts[index + 1]?.index, heading === -1 ? undefined : start + heading].filter((value) => value !== undefined);
    const end = ends.length === 0 ? html.length : Math.min(...ends);
    parts.set(match[1], html.slice(start, end));
  }
  return parts;
}

// The part of the page from an element id to the first match of `end` after it,
// or to the end of the page.
function partFrom(html, id, end) {
  const at = html.indexOf(`id="${id}"`);
  if (at === -1) return "";
  const rest = html.slice(at);
  const stop = rest.search(end);
  return stop === -1 ? rest : rest.slice(0, stop);
}

// The href of every link.
function hrefs(html) {
  return [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map((match) => match[1]);
}

// The contents of every <code> element.
function codeNames(html) {
  return new Set([...html.matchAll(/<code\b[^>]*>([\s\S]*?)<\/code>/g)].map((match) => textOf(match[1])));
}

// The rows of a table that name a kind in their first cell.
function tableRows(part) {
  return [...part.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)]
    .map((match) => match[1])
    .filter((row) => /<td\b/.test(row));
}

function rowKind(row) {
  const cell = row.match(/<td\b[^>]*>([\s\S]*?)<\/td>/)?.[1] ?? "";
  return codeNames(cell).values().next().value ?? null;
}

// A date that exists on the calendar, so 2026-02-30 is not one.
function calendarDate(iso) {
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(iso);
  if (match === null) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/**
 * @param {string} html the built /privacy/problem-reports/ page
 * @param {Record<string, any>} schema the built schema copy
 * @returns {string[]} what is wrong, as messages; empty when the page is complete
 */
export function checkPrivacyPage(html, schema) {
  const errors = [];
  const firstKind = html.search(/id="kind-/);
  const envelope = firstKind === -1 ? html : html.slice(0, firstKind);
  const names = new Set(fieldNames(envelope));
  for (const field of envelopeFields(schema)) {
    if (!names.has(field)) errors.push(`the envelope table has no row for the field ${field}.`);
  }

  const parts = kindParts(html);
  for (const kind of schema?.properties?.kind?.enum ?? []) {
    const part = parts.get(kind);
    if (part === undefined) {
      errors.push(`the kind ${kind} has no id="kind-${kind}" part.`);
      continue;
    }
    const kindNames = new Set(fieldNames(part));
    for (const field of Object.keys(schema.$defs?.[kind]?.properties ?? {})) {
      if (!kindNames.has(field)) errors.push(`the kind ${kind} has no row for the field ${field}.`);
    }
    if (kind === "app_problem") {
      const partText = textOf(part);
      for (const appId of schema.$defs.app_problem.properties.app_id.enum ?? []) {
        if (!partText.includes(appId)) errors.push(`the kind app_problem does not name the app ID ${appId}.`);
      }
    }
  }

  return errors;
}

/**
 * @param {string} html the built /privacy/problem-reports/ page
 * @returns {string[]} what is wrong with the public bug reports section, as
 * messages; empty when the section keeps every promise it makes
 */
export function checkPublicBugReports(html) {
  const errors = [];
  const anchors = [...html.matchAll(/id="public-bug-reports"/g)].length;
  if (anchors !== 1) errors.push(`the page has ${anchors} elements with the id public-bug-reports: a section must have exactly 1.`);
  const section = partFrom(html, "public-bug-reports", /<h2\b/);
  if (section === "") return errors;

  // The holds part: 1 row for each kind of the closed list, and no other row.
  const holds = partFrom(html, "public-bug-reports-holds", /id="public-bug-reports-never"/);
  const rows = tableRows(holds);
  const known = new Set(PUBLIC_BUG_REPORT_FIELDS.map((item) => item.kind));
  for (const item of PUBLIC_BUG_REPORT_FIELDS) {
    const row = rows.find((candidate) => rowKind(candidate) === item.kind);
    if (row === undefined) {
      errors.push(`the public bug reports table has no row for the kind ${item.kind}.`);
      continue;
    }
    const codes = codeNames(row);
    for (const field of item.fields) {
      if (!codes.has(field)) errors.push(`the row of the kind ${item.kind} does not name the field ${field} in code.`);
    }
    const rowText = textOf(row);
    for (const phrase of item.says) {
      if (!rowText.includes(phrase)) errors.push(`the row of the kind ${item.kind} does not say "${phrase}".`);
    }
  }
  for (const kind of rows.map(rowKind)) {
    if (kind === null) errors.push("the public bug reports table has a row whose first cell does not name a kind in code.");
    else if (PUBLIC_BUG_REPORT_REFUSED.includes(kind)) errors.push(`the public bug reports table has a row for the kind ${kind}, which never opens an issue.`);
    else if (!known.has(kind)) errors.push(`the public bug reports table has a row for the kind ${kind}, which ADR-0074 does not publish.`);
  }
  const holdsText = textOf(holds);
  for (const phrase of PUBLIC_BUG_REPORT_HOLDS_SAYS) {
    if (!holdsText.includes(phrase)) errors.push(`the public bug reports section does not state "${phrase}".`);
  }

  // The never part: the values it names in code, and the lines it states.
  const never = partFrom(html, "public-bug-reports-never", /id="public-bug-reports-residue"/);
  const neverCodes = codeNames(never);
  for (const name of PUBLIC_BUG_REPORT_NEVER) {
    if (!neverCodes.has(name)) errors.push(`the public bug reports section does not name ${name} in code in its never holds part.`);
  }
  const neverText = textOf(never);
  for (const phrase of PUBLIC_BUG_REPORT_NEVER_SAYS) {
    if (!neverText.includes(phrase)) errors.push(`the public bug reports section does not say "${phrase}" in its never holds part.`);
  }

  // The sentences that the section itself must state word for word.
  const sectionText = textOf(section);
  for (const sentence of PUBLIC_BUG_REPORT_SAYS) {
    if (!sectionText.includes(sentence)) errors.push(`the public bug reports section does not state "${sentence}".`);
  }

  // The cutoff: exactly 1 real calendar date, and the words that say how to
  // read it. frostyard/problem-intake copies this date from the live page into
  // triage/config.json (first_seen_cutoff).
  const cutoff = partFrom(html, "public-bug-reports-cutoff", /id="public-bug-reports-deletion"/);
  const times = [...cutoff.matchAll(/<time\b[^>]*\bdatetime="([^"]*)"/g)].map((match) => match[1]);
  if (times.length !== 1) errors.push(`the public bug reports cutoff part has ${times.length} time elements with a datetime: it must have exactly 1.`);
  else if (!calendarDate(times[0])) errors.push(`the public bug reports cutoff date ${times[0]} is not a real calendar date.`);
  const cutoffText = textOf(cutoff);
  for (const phrase of ["first saw on or after", "00:00 UTC"]) {
    if (!cutoffText.includes(phrase)) errors.push(`the public bug reports cutoff part does not say "${phrase}".`);
  }

  // The pinned sources, and the search that lists every public issue.
  if (!hrefs(html).some((href) => ADR_0074.test(href))) errors.push("the page must link frostyard/core ADR-0074 at a pinned commit, not on blob/main.");
  if (!html.includes(`href="${ISSUE_SEARCH}"`)) errors.push("the page must link the GitHub search that lists every public bug report.");
  if (!html.includes(`href="${TRIAGE_SPEC}"`)) errors.push("the page must link the triage spec of frostyard/problem-intake.");

  // The statistics part and the rights part must point at the new section, so a
  // reader who asks about a public issue can find it from either one.
  const statistics = partFrom(html, "public-statistics", /<h2\b/);
  const statisticsText = textOf(statistics);
  for (const phrase of ["We never publish single reports", "A number from 1 to 4 is never published"]) {
    if (!statisticsText.includes(phrase)) errors.push(`the public statistics part does not say "${phrase}".`);
  }
  if (!statistics.includes('href="#public-bug-reports"')) errors.push("the public statistics part must link #public-bug-reports.");

  const rights = partFrom(html, "your-rights", /<h2\b/);
  const items = [...rights.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((match) => match[1]);
  const deletion = items.find((item) => textOf(item).includes("Delete a report"));
  if (deletion === undefined) errors.push('the your rights part has no "Delete a report" item.');
  else if (!deletion.includes('href="#public-bug-reports"')) errors.push('the "Delete a report" item must link #public-bug-reports, because a public bug report stays.');

  return errors;
}

/**
 * @param {string} html the built /privacy/problem-reports/ page
 * @returns {string|null} the ISO date of the publication cutoff, or null when
 * the page does not state exactly 1 real date for it
 */
export function publicBugReportsCutoff(html) {
  const part = partFrom(html, "public-bug-reports-cutoff", /id="public-bug-reports-deletion"/);
  const times = [...part.matchAll(/<time\b[^>]*\bdatetime="([^"]*)"/g)].map((match) => match[1]);
  if (times.length !== 1 || !calendarDate(times[0])) return null;
  return times[0];
}

function expectedStatsValues(snapshot) {
  const latest = snapshot?.stats?.latest ?? null;
  if (latest === null) return [];
  const expected = [];
  for (const name of TABLE_NAMES) {
    const table = latest.tables?.[name] ?? {};
    for (const group of Object.values(table.groups ?? {})) {
      for (const value of Object.values(group.cells ?? {})) {
        expected.push(value === null ? "hidden" : String(value));
      }
      expected.push(group.total === null ? "hidden" : String(group.total));
    }
    if (table.total === null) expected.push("hidden");
    // An empty table publishes 0, which the page shows without data-stat.
    else if (typeof table.total === "number" && table.total !== 0) expected.push(String(table.total));
  }
  return expected;
}

function difference(left, right) {
  const rest = [...right];
  const missing = [];
  for (const value of left) {
    const index = rest.indexOf(value);
    if (index === -1) missing.push(value);
    else rest.splice(index, 1);
  }
  return { missing, extra: rest };
}

/**
 * @param {string} html the built /stats/ page
 * @param {Record<string, any>} snapshot the validated src/data/problem-stats.json
 * @returns {string[]} what is wrong, as messages; empty when the page matches the snapshot
 */
export function checkStatsPage(html, snapshot) {
  const errors = [];
  const rendered = [...html.matchAll(/data-stat="([^"]*)"/g)].map((match) => match[1]);
  for (const value of rendered) {
    if (value !== "hidden" && !(/^[0-9]+$/.test(value) && Number(value) >= 5)) {
      errors.push(`the page renders data-stat="${value}": no published count is from 1 to 4.`);
    }
  }

  if ((snapshot?.stats?.latest ?? null) === null) {
    if (!textOf(html).includes("No data yet")) errors.push('the page must say "No data yet" while the snapshot is empty.');
    if (rendered.length !== 0) errors.push("the page renders a count while the snapshot has no week.");
    return errors;
  }

  // Every table renders, empty ones too, with its total (0, a count, or hidden).
  for (const name of TABLE_NAMES) {
    const table = snapshot.stats.latest.tables?.[name];
    const want = table?.total === null ? "hidden" : String(table?.total);
    const section = html.match(new RegExp(`<section\\b[^>]*\\bdata-stats-table="${name}"[^>]*>`));
    if (section === null) {
      errors.push(`the page does not render the table ${name}.`);
      continue;
    }
    const total = section[0].match(/\bdata-table-total="([^"]*)"/)?.[1];
    if (total !== want) errors.push(`the table ${name} renders the total ${JSON.stringify(total)}, not ${JSON.stringify(want)}.`);
  }

  const expected = expectedStatsValues(snapshot);
  const { missing, extra } = difference(expected, rendered);
  if (missing.length > 0) errors.push(`the page does not render ${missing.length} count(s) that the snapshot publishes: ${missing.join(", ")}.`);
  if (extra.length > 0) errors.push(`the page renders ${extra.length} count(s) that the snapshot does not publish: ${extra.join(", ")}.`);
  return errors;
}
